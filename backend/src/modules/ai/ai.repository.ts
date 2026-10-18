import { prisma } from "../../lib/prisma.js";
import type {AIAnalysisStatus, Sentiment, TicketPriority, TicketCategory} from "../../generated/prisma/client.js";

type AnalysisResult = {
  sentiment: Sentiment;
  suggestedPriority: TicketPriority;
  suggestedCategory: TicketCategory;
  summary: string;
  reason: string;
  confidence: number;
  provider: string;
  model: string;
  promptVersion: string;
};

export const aiRepository = {
    findTicketForAnalysis(ticketId: string) {
        return prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                description: true,
                category: true,
                priority: true,
                messages: {
                    where: { isInternal: false },
                    orderBy: { createdAt: "asc" },
                    take: 20,
                    select: {
                        body: true,
                        createdAt: true,
                        sender: {
                            select: { role: true },
                        },
                    },
                },
            },
        });
    },
    
    findTicketAnalyses(ticketId: string) {
        return prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                aiAnalyses: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    sentiment: true,
                    suggestedPriority: true,
                    suggestedCategory: true,
                    summary: true,
                    reason: true,
                    confidence: true,
                    provider: true,
                    model: true,
                    promptVersion: true,
                    errorMessage: true,
                    createdAt: true,
                    completedAt: true,
                },
                },
            },
        });
    },


    createPending(ticketId: string) {
        return prisma.ticketAIAnalysis.create({
            data: {
                ticketId,
                status: "PENDING",
            },
        });
    },

    updateStatus(id: string, status: AIAnalysisStatus) {
        return prisma.ticketAIAnalysis.update({
            where: { id },
            data: { status },
        });
    },

    markProcessing(id: string) {
        return prisma.ticketAIAnalysis.update({
            where: { id },
            data: {
                status: "PROCESSING",
                errorMessage: null,
            },
        });
    },

    markCompleted(id: string, result: AnalysisResult) {
        return prisma.ticketAIAnalysis.update({
            where: { id },
            data: {
                ...result,
                status: "COMPLETED",
                completedAt: new Date(),
                errorMessage: null,
            },
        });
    },

    markFailed(id: string, errorMessage: string) {
        return prisma.ticketAIAnalysis.update({
            where: { id },
            data: {
                status: "FAILED",
                errorMessage: errorMessage.slice(0, 2000),
            },
        });
    },

    findTicketForReplyDraft(ticketId: string) {
        return prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                description: true,
                status: true,
                messages: {
                    where: { isInternal: false },
                    orderBy: { createdAt: "asc" },
                    take: 20,
                    select: {
                        body: true,
                        sender: {
                            select: { role: true },
                        },
                    },
                },
            },
        });
    },

    createReplyDraft(data: {
        ticketId: string;
        generatedById: string;
        content: string;
        provider: string;
        model: string;
    }) {
        return prisma.aIReplyDraft.create({
            data,
        });
    },

    findReplyDrafts(ticketId: string) {
        return prisma.aIReplyDraft.findMany({
            where: { ticketId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                content: true,
                status: true,
                provider: true,
                model: true,
                createdAt: true,
                updatedAt: true,
                sentAt: true,
                generatedBy: {
                    select: { id: true, name: true },
                },
            },
        });
    },

    findReplyDraftById(id: string) {
        return prisma.aIReplyDraft.findUnique({
            where: { id },
            select: {
                id: true,
                ticketId: true,
                content: true,
                status: true,
            },
        });
    },

    async sendReplyDraft(data: {
        draftId: string;
        ticketId: string;
        senderId: string;
    }) {
    return prisma.$transaction(async (tx) => {
        const draft = await tx.aIReplyDraft.findUnique({
            where: { id: data.draftId },
        });

        if (!draft || draft.ticketId !== data.ticketId || draft.status !== "DRAFT") {
            return null;
        }

        const ticket = await tx.ticket.findUnique({
            where: { id: data.ticketId },
            select: { status: true },
        });

        if (!ticket || ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
            return null;
        }

        const message = await tx.ticketMessage.create({
            data: {
                ticketId: data.ticketId,
                senderId: data.senderId,
                body: draft.content,
                isInternal: false,
            },
            include: {
                sender: true,
            },
        });

        const updated = await tx.aIReplyDraft.updateMany({
            where: {
                id: data.draftId,
                ticketId: data.ticketId,
                status: "DRAFT",
            },
            data: {
                status: "SENT",
                sentMessageId: message.id,
                sentAt: new Date(),
            },
        });

        if (updated.count !== 1) {
            throw new Error("Draft has already been processed");
        }

        await tx.auditLog.create({
            data: {
                actorId: data.senderId,
                ticketId: data.ticketId,
                action: "AI_REPLY_DRAFT_SENT",
                metadata: { draftId: data.draftId },
            },
        });

        return message;
        });
    },

    async discardReplyDraft(draftId: string, ticketId: string, actorId: string) {
        return prisma.$transaction(async (tx) => {
            const updated = await tx.aIReplyDraft.updateMany({
                where: {
                    id: draftId,
                    ticketId,
                    status: "DRAFT",
                },
                data: { status: "DISCARDED" },
            });

            if (updated.count !== 1) {
                return false;
            }

            await tx.auditLog.create({
                data: {
                    actorId,
                    ticketId,
                    action: "AI_REPLY_DRAFT_DISCARDED",
                    metadata: { draftId },
                },
            });

            return true;
        });
    },
};
