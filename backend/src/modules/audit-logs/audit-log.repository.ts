import { prisma } from "../../lib/prisma.js";
import type { AuditLogQuery } from "./audit-log.validation.js";

export const auditLogRepository = {
    findAll(query: AuditLogQuery) {
        const where = {
            ...(query.action && { action: query.action }),
            ...(query.ticketId && { ticketId: query.ticketId }),
            ...(query.actorId && { actorId: query.actorId }),
        };

        return prisma.$transaction([
            prisma.auditLog.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    ticket: {
                        select: {
                            id: true,
                            ticketNumber: true,
                            subject: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            prisma.auditLog.count({ where }),
        ]);
    },
};
