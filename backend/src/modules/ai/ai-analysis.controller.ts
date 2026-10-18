import type { RequestHandler } from "express";
import { aiAnalysisService } from "./ai-analysis.service.js";
import { success } from "../../utils/response.js";

export const findTicketAnalyses: RequestHandler = async (req, res, next) => {
    try {
      const result = await aiAnalysisService.findTicketAnalyses(req.params.id as string);

      return success(res, result, "Analisis AI berhasil diambil", 200)
    } catch (error) {
      next(error);
    }
};
