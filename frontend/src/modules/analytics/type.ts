import type { TicketPriority, TicketStatus } from "../tickets/type";

export interface AnalyticsOverview {
    summary: {
        totalTickets: number;
        openTickets: number;
        resolvedTickets: number;
        closedTickets: number;
    };
    byStatus: Array<{ status: TicketStatus; total: number }>;
    byPriority: Array<{ priority: TicketPriority; total: number }>;
    byCategory: Array<{ category: string; total: number }>;
    bySentiment: Array<{ sentiment: string; total: number }>;
    ticketTrend: Array<{ date: string; total: number }>;
    averageResolutionSeconds: number | null;
}