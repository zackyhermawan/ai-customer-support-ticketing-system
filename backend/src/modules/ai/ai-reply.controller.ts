import type { RequestHandler } from "express";
import { aiReplyService } from "./ai-reply.service.js";
import { success } from "../../utils/response.js";

export const generateDraft: RequestHandler = async (req, res, next) => {
    try {
        const draft = await aiReplyService.generateDraft(req.params.id as string, req.user!.id);

        return success(res, draft, "Draft balasan AI berhasil dibuat", 201)
    } catch (error) {
        next(error);
    }
};

export const findDrafts: RequestHandler = async (req, res, next) => {
    try {
        const result = await aiReplyService.findDrafts(req.params.id as string);

        return success(res, result, "Draft balasan AI berhasil diambil", 200)
    } catch (error) {
        next(error);
    }
};

export const sendDraft: RequestHandler = async (req, res, next) => {
    try {
        const message = await aiReplyService.sendDraft(req.params.id as string, req.params.draftId as string, req.user!.id);

        return success(res, message, "Balasan AI berhasil dikirim", 200)
    } catch (error) {
        next(error);
    }
};

export const discardDraft: RequestHandler = async (req, res, next) => {
    try {
        const result = await aiReplyService.discardDraft(req.params.id as string, req.params.draftId as string, req.user!.id);

            return success(res, result, "Draft balasan AI berhasil dibuang", 200)
    } catch (error) {
        next(error);
    }
};