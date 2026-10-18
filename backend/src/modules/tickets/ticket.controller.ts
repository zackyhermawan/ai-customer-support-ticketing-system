import type { RequestHandler } from "express";
import { ticketService } from "./ticket.service.js";
import {createTicketSchema, ticketListQuerySchema, createMessageSchema, updateStatusSchema, updatePrioritySchema, assignTicketSchema} from "./ticket.validation.js";
import { success } from "../../utils/response.js";

export const create: RequestHandler = async (req, res, next) => {
    try {
        const input = createTicketSchema.parse(req.body);
        const ticket = await ticketService.create(input, req.user!);

        return success(res, ticket, "Tiket berhasil dibuat", 201)
    } catch (error) {
        next(error);
    }
};

export const findMyTickets: RequestHandler = async (req, res, next) => {
    try {
        const query = ticketListQuerySchema.parse(req.query);
        const result = await ticketService.findMyTickets(query, req.user!);

        return success(res, result, "Tiket berhasil diambil", 200)
    } catch (error) {
        next(error);
    }
};

export const findAll: RequestHandler = async (req, res, next) => {
    try {
        const query = ticketListQuerySchema.parse(req.query);
        const result = await ticketService.findAll(query, req.user!);

        return success(res, result, "Tiket berhasil diambil", 200)
    } catch (error) {
        next(error);
    }
};

export const findById: RequestHandler = async (req, res, next) => {
    try {
        const ticket = await ticketService.findById(req.params.id as string, req.user!);

        return success(res, ticket, "Tiket berhasil diambil", 200)
    } catch (error) {
        next(error);
    }
};

export const markAsRead: RequestHandler = async(req, res, next) => {
    try {
        const result = await ticketService.markAsRead(req.params.id as string, req.user!);
      
        return success(res, result, "Pesan berhasil ditandai sudah dibaca", 200)
    } catch (error) {
        next(error)
    }
}

export const createMessage: RequestHandler = async (req, res, next) => {
    try {
        const input = createMessageSchema.parse(req.body);
        const message = await ticketService.createMessage(req.params.id as string, input, req.user!);

        return success(res, message, "Pesan berhasil dibuat", 200)
    } catch (error) {
        next(error);
    }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const input = updateStatusSchema.parse(req.body);
    const ticket = await ticketService.updateStatus(req.params.id as string, input, req.user!);

    return success(res, ticket, "Status tiket berhasil diperbarui", 200)
  } catch (error) {
    next(error);
  }
};

export const updatePriority: RequestHandler = async (req, res, next) => {
    try {
        const input = updatePrioritySchema.parse(req.body);
        const ticket = await ticketService.updatePriority(req.params.id as string, input, req.user!);

        return success(res, ticket, "Prioritas tiket berhasil diperbarui", 200)
    } catch (error) {
        next(error);
    }
};

export const assign: RequestHandler = async (req, res, next) => {
    try {
        const input = assignTicketSchema.parse(req.body);
        const ticket = await ticketService.assign(req.params.id as string, input, req.user!);

        return success(res, ticket, "Tiket berhasil ditugaskan", 200)
    } catch (error) {
        next(error);
    }
};
