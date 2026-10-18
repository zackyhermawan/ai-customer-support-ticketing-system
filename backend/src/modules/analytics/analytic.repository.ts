import { prisma } from "../../lib/prisma.js";

export const analyticsRepository = {
    async getOverview(startDate: Date) {
        const [
            totalTickets,
            openTickets,
            resolvedTickets,
            closedTickets,
            byStatus,
            byPriority,
            byCategory,
            recentTickets,
            latestAnalyses,
            averageResolutionResult
        ] = await Promise.all([
            prisma.ticket.count(),

            prisma.ticket.count({
                where: {
                    status: {
                        in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"],
                    },
                },
            }),

            prisma.ticket.count({
                where: { status: "RESOLVED" },
            }),

            prisma.ticket.count({
                where: { status: "CLOSED" },
            }),

            prisma.ticket.groupBy({
                by: ["status"],
                _count: { _all: true },
            }),

            prisma.ticket.groupBy({
                by: ["priority"],
                _count: { _all: true },
            }),

            prisma.ticket.groupBy({
                by: ["category"],
                _count: { _all: true },
            }),

            prisma.ticket.findMany({
                where: { createdAt: { gte: startDate } },
                select: { createdAt: true },
            }),

            prisma.ticketAIAnalysis.findMany({
                where: {
                    status: "COMPLETED",
                    sentiment: { not: null },
                },
                orderBy: [
                    { ticketId: "asc" },
                    { createdAt: "desc" },
                ],
                distinct: ["ticketId"],
                select: { sentiment: true },
            }),
            
            prisma.$queryRaw<Array<{ averageSeconds: number | null }>>`SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt"))) AS "averageSeconds" FROM "Ticket" WHERE "resolvedAt" IS NOT NULL`,

        ]);

        const sentimentCounts = {
            ANGRY: 0,
            FRUSTRATED: 0,
            NEUTRAL: 0,
            SATISFIED: 0,
        };

        for (const analysis of latestAnalyses) {
            if (analysis.sentiment) {
                sentimentCounts[analysis.sentiment]++;
            }
        }

        const dailyCounts = new Map<string, number>();

        for (const ticket of recentTickets) {
            const date = ticket.createdAt.toISOString().slice(0, 10);
            dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
        }

        const ticketTrend = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(startDate);
            date.setUTCDate(date.getUTCDate() + index);
            const dateKey = date.toISOString().slice(0, 10);

            return {
                date: dateKey,
                total: dailyCounts.get(dateKey) ?? 0,
            };
        });

        return {
            summary: {
                totalTickets,
                openTickets,
                resolvedTickets,
                closedTickets,
            },
            byStatus: byStatus.map((item) => ({
                status: item.status,
                total: item._count._all,
            })),
            byPriority: byPriority.map((item) => ({
                priority: item.priority,
                total: item._count._all,
            })),
            byCategory: byCategory.map((item) => ({
                category: item.category,
                total: item._count._all,
            })),
            bySentiment: Object.entries(sentimentCounts).map(
                ([sentiment, total]) => ({ sentiment, total }),
            ),
            averageResolutionSeconds: averageResolutionResult[0]?.averageSeconds == null ? null : Number(averageResolutionResult[0].averageSeconds),
            ticketTrend,
        };
    },
};
