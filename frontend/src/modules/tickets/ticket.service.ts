import { api } from "@/lib/api";
import type { CreateCustomerTicketPayload, CustomerTicket, CustomerTicketFilters, Ticket, TicketFilters } from "./type";
import type { ApiResponse, ApiResponseWithPagination } from "@/types/type";

export const ticketsService = {
    async getAll(filters: TicketFilters) {
        const response = await api.get<ApiResponseWithPagination<Ticket>>("/tickets", { params: filters });
        return response.data;
    },

    async getMyTickets(filters: CustomerTicketFilters) {
        const response = await api.get<ApiResponseWithPagination<CustomerTicket>>("/tickets/my", { params: filters });

        return response.data;
    },

    async markAsRead(ticketId: string) {
        const response = await api.post(`/tickets/${ticketId}/read`);

        return response.data;
    },

    async create(payload: CreateCustomerTicketPayload) {
        const response = await api.post<ApiResponse<CustomerTicket>>("/tickets", payload);

        return response.data.data;
    },
};