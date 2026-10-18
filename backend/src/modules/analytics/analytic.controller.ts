import type { RequestHandler } from "express";
import { analyticsService } from "./analytic.service.js";
import { success } from "../../utils/response.js";

export const getOverview: RequestHandler = async (_req, res, next) => {
    try {
        const data = await analyticsService.getOverview();

        return success(res, data, "Dashboard analitik berhasil diambil", 200)
    } catch (error) {
        next(error);
    }
};
