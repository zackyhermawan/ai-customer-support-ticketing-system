import { AppError } from "../../lib/app-error.js";
import { aiRepository } from "./ai.repository.js";

export const aiAnalysisService = {
    async findTicketAnalyses(ticketId: string) {
        const ticket = await aiRepository.findTicketAnalyses(ticketId);

        if (!ticket) {
            throw new AppError(404, "Ticket not found");
        }

        return {
            ticket: {
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                subject: ticket.subject,
            },
            analyses: ticket.aiAnalyses,
        };
    },
};
