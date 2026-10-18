import type { ApiResponse } from "@/types/type";
import type { AIReplyDraft, TicketAIAnalysis, TicketAnalysis, TicketDetail, TicketMessage, TicketPriority, TicketStatus } from "./type";
import { api } from "@/lib/api";

export const ticketDetailService = {
    async getDetail(ticketId: string) {
        const response = await api.get<ApiResponse<TicketDetail>>(`/tickets/${ticketId}`);
        return response.data.data;
    },

    async getAnalysis(ticketId: string) {
        const response = await api.get<ApiResponse<{ ticket: TicketAnalysis; analyses: TicketAIAnalysis[] }>>(`/tickets/${ticketId}/ai-analysis`);
        return response.data.data.analyses;
    },

    async sendMessage(ticketId: string, body: string) {
        const response = await api.post<ApiResponse<TicketMessage>>(`/tickets/${ticketId}/messages`, { body });

        return response.data.data;
    },

    async getDrafts(ticketId: string) {
        const response = await api.get<ApiResponse<{ ticketId: string; drafts: AIReplyDraft[] }>>(`/tickets/${ticketId}/ai-replies/drafts`);
        return response.data.data.drafts;
    },

    async generateDraft(ticketId: string) {
        const response = await api.post<ApiResponse<AIReplyDraft>>(`/tickets/${ticketId}/ai-replies/drafts`);
        return response.data.data;
    },

    async sendDraft(ticketId: string, draftId: string) {
        const response = await api.post<ApiResponse<TicketMessage>>(`/tickets/${ticketId}/ai-replies/drafts/${draftId}/send`);
        return response.data.data;
    },

    async discardDraft(ticketId: string, draftId: string) {
        const response = await api.delete<ApiResponse<{ id: string; status: "DISCARDED" }>>(`/tickets/${ticketId}/ai-replies/drafts/${draftId}`);
        return response.data.data;
    },

    async updateStatus(ticketId: string, status: TicketStatus) {
        const response = await api.patch<ApiResponse<{ ticket: TicketDetail }>>(`/tickets/${ticketId}/status`, { status });
        return response.data.data.ticket;
    },

    async updatePriority(ticketId: string, priority: TicketPriority) {
        const response = await api.patch<ApiResponse<{ ticket: TicketDetail }>>(`/tickets/${ticketId}/priority`, { priority });
        return response.data.data.ticket;
    }

};