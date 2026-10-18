import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { ticketRepository } from "./ticket.repository.js";
import type { ListQuery, CreateTicketInput, MessageInput, StatusInput, PriorityInput, AssignInput } from "./ticket.validation.js";
import { enqueueTicketAnalysis } from "../ai/ai.queue.service.js";
import {getIO, getTicketAdminRoom, getTicketPublicRoom} from "../../lib/socket.js";

type Actor = {
    id: string;
    role: "CUSTOMER" | "ADMIN";
};

function createTicketNumber() {
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    return `TKT-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function validateListFilters(query: ListQuery) {
    return {
        ...query,
        search: query.search || undefined
    };
}

async function getTicketOrFail(id: string) {
    const ticket = await ticketRepository.findById(id);

    if (!ticket) {
        throw new AppError(404, "Tiket tidak ditemukan");
    }

    return ticket;
}

function ensureTicketAccess(ticket: { customerId: string }, actor: Actor) {
    if (actor.role === "CUSTOMER" && ticket.customerId !== actor.id) {
        throw new AppError(404, "Tiket tidak ditemukan");
    }
}

export const ticketService = {
    async create(input: CreateTicketInput, actor: Actor) {
        const ticket = await ticketRepository.create({
            ticketNumber: createTicketNumber(),
            subject: input.subject,
            description: input.description,
            category: input.category,
            customerId: actor.id,
        })
        
        await enqueueTicketAnalysis(ticket.id);

        return ticket
    },

    async findMyTickets(query: ListQuery, actor: Actor) {
        const [items, total] = await ticketRepository.findCustomerTickets(
            actor.id,
            validateListFilters(query),
        );

        const unreadCounts = await ticketRepository.getUnreadCounts(
            items.map((ticket) => ticket.id),
            actor.id,
            actor.role,
        );

        return {
            items: items.map((ticket) => ({
                ...ticket,
                unreadCount: unreadCounts.get(ticket.id) ?? 0,
            })),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    },

    async findAll(query: ListQuery, actor: Actor) {
        const [items, total] = await ticketRepository.findAll(validateListFilters(query));

        const unreadCounts = await ticketRepository.getUnreadCounts(items.map((ticket) => ticket.id), actor.id, actor.role);

        return {
            items: items.map((ticket) => ({
                ...ticket,
                unreadCount: unreadCounts.get(ticket.id) ?? 0,
            })),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    },

    async findById(id: string, actor: Actor) {
        const ticket = await getTicketOrFail(id);

        ensureTicketAccess(ticket, actor);

        const newMessagesStartId =
            await ticketRepository.markMessagesAsRead(
                id,
                actor.id,
                actor.role,
            );

        if (actor.role === "ADMIN") {
            return {
                ...ticket,
                newMessagesStartId,
            };
        }

        const { messages, aiAnalyses: _, ...publicTicket } = ticket;

        return {
            ...publicTicket,
            messages: messages.filter((message) => !message.isInternal),
            newMessagesStartId,
        };
    },

    async markAsRead(ticketId: string, actor: Actor) {
        const ticket = await getTicketOrFail(ticketId);

        ensureTicketAccess(ticket, actor);

        await ticketRepository.markMessagesAsRead(ticketId, actor.id, actor.role);

        return { success: true };
    },

    async createMessage(ticketId: string, input: MessageInput, actor: Actor) {
        const ticket = await getTicketOrFail(ticketId);
        ensureTicketAccess(ticket, actor);

        if (input.isInternal && actor.role !== "ADMIN") {
            throw new AppError(403, "Hanya admin yang dapat menambahkan catatan internal");
        }

        if (actor.role === "CUSTOMER" && ["RESOLVED", "CLOSED"].includes(ticket.status)) {
            throw new AppError(400, "Tiket ini tidak lagi menerima balasan");
        }

        if (actor.role === "ADMIN" && !input.isInternal && ["RESOLVED", "CLOSED"].includes(ticket.status)) {
            throw new AppError(400, "Buka kembali tiket sebelum mengirim balasan");
        }

        const message = await ticketRepository.createMessage({
            ticketId,
            senderId: actor.id,
            body: input.body,
            isInternal: input.isInternal
        });
        
        const io = getIO();

        if (message.isInternal) {
        io.to(getTicketAdminRoom(ticketId)).emit(
            "ticket:message:new",
            message,
        );
        } else {
        io.to(getTicketPublicRoom(ticketId)).emit(
            "ticket:message:new",
            message,
        );

        if (actor.role === "CUSTOMER") {
            // Pesan customer membuat badge admin bertambah
            io.to("role:ADMIN").emit("ticket:unread:update", {
            ticketId,
            });
        } else if (actor.role === "ADMIN") {
            // Pesan admin membuat badge customer terkait bertambah
            io.to(`user:${ticket.customerId}`).emit(
            "ticket:unread:update",
            { ticketId },
            );
        }
        }

        return message;
    },

    async updateStatus(id: string, input: StatusInput, actor: Actor) {
        await getTicketOrFail(id);

        return ticketRepository.updateStatus(id, input.status, actor.id);
    },

    async updatePriority(id: string, input: PriorityInput, actor: Actor) {
        await getTicketOrFail(id);

        return ticketRepository.updatePriority(id, input.priority, actor.id);
    },

    async assign(id: string, input: AssignInput, actor: Actor) {
        await getTicketOrFail(id);

        if (input.assignedToId !== null) {
            const assignee = await prisma.user.findUnique({
                where: { id: input.assignedToId },
                select: {
                    id: true, 
                    role: true, 
                    isActive: true
                }
            });

            if (!assignee || assignee.role !== "ADMIN" || !assignee.isActive) {
                throw new AppError(400, "Penerima tugas harus merupakan administrator aktif");
            }
        }

        return ticketRepository.assign(id, input.assignedToId, actor.id);
    }
};
