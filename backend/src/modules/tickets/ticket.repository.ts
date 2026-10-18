import { prisma } from "../../lib/prisma.js";
import type {TicketStatus, TicketPriority, TicketCategory} from "../../generated/prisma/client.js";
import { ListQuery } from "./ticket.validation.js";

export const ticketRepository = {
    create(data: {
        ticketNumber: string;
        subject: string;
        description: string;
        category: TicketCategory;
        customerId: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.create({
                data,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true 
                        }
                    }
                }
            });

            await tx.auditLog.create({
                data: {
                    actorId: data.customerId,
                    ticketId: ticket.id,
                    action: "TICKET_CREATED"
                }
            });

            return ticket;
        });
    },

    findById(id: string) {
        return prisma.ticket.findUnique({
            where: { id },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true 
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true 
                    }
                },
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                role: true 
                            }
                        }
                    }
                },
                aiAnalyses: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        });
    },

    findCustomerTickets(customerId: string, filters: ListQuery) {
        const where = {
            customerId,
            ...(filters.status && { status: filters.status }),
            ...(filters.priority && { priority: filters.priority }),
            ...(filters.category && { category: filters.category }),
            ...(filters.search && {
                OR: [
                    {
                        subject: {
                            contains: filters.search, mode: "insensitive" as const 
                        }
                    },
                    {
                        ticketNumber: {
                            contains: filters.search, mode: "insensitive" as const 
                        }
                    }
                ]
            })
        };

        return prisma.$transaction([
            prisma.ticket.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            }),
            prisma.ticket.count({ where })
        ]);
    },

    async findAll(filters: ListQuery) {
        const where = {
            ...(filters.status && { status: filters.status }),
            ...(filters.priority && { priority: filters.priority }),
            ...(filters.category && { category: filters.category }),
            ...(filters.search && {
                OR: [
                    {
                        subject: {
                            contains: filters.search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        ticketNumber: {
                            contains: filters.search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            }),
        };

        const [items, total, unreadGroups] = await prisma.$transaction([
            prisma.ticket.findMany({
                where,
                include: {
                    customer: {
                        select: { id: true, name: true, email: true },
                    },
                    assignedTo: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
            }),
            prisma.ticket.count({ where }),
            prisma.ticketMessage.groupBy({
                by: ["ticketId"],
                where: {
                    readAt: null,
                    isInternal: false,
                    sender: { role: "CUSTOMER" },
                },
                _count: { id: true },
            }),
        ]);

        const unreadMap = new Map(
            unreadGroups.map((item) => [
                item.ticketId,
                item._count.id,
            ]),
        );

        return [
            items.map((ticket) => ({
                ...ticket,
                unreadCount: unreadMap.get(ticket.id) ?? 0,
            })),
            total,
        ] as const;
    },

    createMessage(data: {
        ticketId: string;
        senderId: string;
        body: string;
        isInternal: boolean;
    }) {
        return prisma.$transaction(async (tx) => {
            const message = await tx.ticketMessage.create({
                data,
                include: {
                    sender: {
                        select: {
                            id: true, 
                            name: true, 
                            role: true 
                        }
                    }
                }
            });

            await tx.auditLog.create({
                data: {
                    actorId: data.senderId,
                    ticketId: data.ticketId,
                    action: data.isInternal ? "INTERNAL_NOTE_ADDED" : "TICKET_MESSAGE_SENT"
                }
            });

            return message;
        });
    },

    
    updateStatus(
        id: string,
        status: TicketStatus,
        actorId: string
    ) {
        return prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.update({
                where: { id },
                data: {
                    status,
                    resolvedAt: status === "RESOLVED" ? new Date() : ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"].includes(status) ? null : undefined,
                    closedAt: status === "CLOSED" ? new Date() : ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED"].includes(status) ? null : undefined
                }
            });

            await tx.auditLog.create({
                data: {
                    actorId,
                    ticketId: id,
                    action: "TICKET_STATUS_UPDATED",
                    metadata: { status }
                }
            });

            return ticket;
        });
    },


    updatePriority(
        id: string,
        priority: TicketPriority,
        actorId: string
    ) {
        return prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.update({
                where: { id },
                data: { priority }
            });

            await tx.auditLog.create({
                data: {
                    actorId,
                    ticketId: id,
                    action: "TICKET_PRIORITY_UPDATED",
                    metadata: { priority }
                }
            });

            return ticket;
        });
    },

    assign(id: string, assignedToId: string | null, actorId: string) {
        return prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.update({
                where: { id },
                data: { assignedToId }
            });

            await tx.auditLog.create({
                data: {
                    actorId,
                    ticketId: id,
                    action: "TICKET_ASSIGNED",
                    metadata: { assignedToId }
                }
            });

            return ticket;
        });
    },

    countUnreadMessagesByTicket() {
        return prisma.ticketMessage.groupBy({
            by: ["ticketId"],
            where: {
                readAt: null,
                isInternal: false,
                sender: {
                    role: "CUSTOMER",
                },
            },
            _count: {
                id: true,
            },
        });
    },

    async getUnreadCounts(
        ticketIds: string[],
        userId: string,
        userRole: "CUSTOMER" | "ADMIN",
    ) {
        if (ticketIds.length === 0) {
            return new Map<string, number>();
        }

        const messages = await prisma.ticketMessage.findMany({
            where: {
                ticketId: { in: ticketIds },
                isInternal: false,
                sender: {
                    role: userRole === "ADMIN" ? "CUSTOMER" : "ADMIN",
                },
                reads: {
                    none: { userId },
                },
            },
            select: {
                ticketId: true,
            },
        });

        const counts = new Map<string, number>();

        for (const message of messages) {
            counts.set(
                message.ticketId,
                (counts.get(message.ticketId) ?? 0) + 1,
            );
        }

        return counts;
    },

    async markMessagesAsRead(
        ticketId: string,
        userId: string,
        userRole: "CUSTOMER" | "ADMIN",
    ) {
        const messages = await prisma.ticketMessage.findMany({
            where: {
                ticketId,
                isInternal: false,
                sender: {
                    role: userRole === "ADMIN" ? "CUSTOMER" : "ADMIN",
                },
                reads: {
                    none: { userId },
                },
            },
            select: {
                id: true,
                createdAt: true,
            },
            orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
            ],
        });

        if (messages.length === 0) {
            return null;
        }

        await prisma.ticketMessageRead.createMany({
            data: messages.map((message) => ({
                messageId: message.id,
                userId,
            })),
            skipDuplicates: true,
        });

        return messages[0].id;
    },

    async findUnreadMessageIds(
        ticketId: string,
        userId: string,
        userRole: "CUSTOMER" | "ADMIN",
    ) {
        const messages = await prisma.ticketMessage.findMany({
            where: {
                ticketId,
                isInternal: false,
                sender: {
                    role: userRole === "ADMIN" ? "CUSTOMER" : "ADMIN",
                },
                reads: {
                    none: { userId },
                },
            },
            select: {
                id: true,
            },
            orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
            ],
        });

        return messages.map((message) => message.id);
    },
};
