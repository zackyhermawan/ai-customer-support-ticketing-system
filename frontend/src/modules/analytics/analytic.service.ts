import type { ApiResponse } from "@/types/type";
import { api } from "../../lib/api";
import type { AnalyticsOverview } from "./type";

export const analyticsService = {
    async getOverview() {
        const response = await api.get<ApiResponse<{overview: AnalyticsOverview}>>("/analytics/overview");

        return response.data.data.overview;
    },
};