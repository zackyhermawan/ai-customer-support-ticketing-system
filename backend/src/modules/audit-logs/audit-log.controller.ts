import type { RequestHandler } from "express";
import { auditLogQuerySchema } from "./audit-log.validation.js";
import { auditLogService } from "./audit-log.service.js";
import { success } from "../../utils/response.js";

export const findAll: RequestHandler = async (req, res, next) => {
    try {
        const query = auditLogQuerySchema.parse(req.query);
        const data = await auditLogService.findAll(query);

        return success(res, data, "Log audit berhasil diambil", 200)
    } catch (error) {
        next(error);
    }
};