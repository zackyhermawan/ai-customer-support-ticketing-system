import { analyticsRepository } from "./analytic.repository.js";

export const analyticsService = {
    async getOverview() {
        const now = new Date();
        const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

        const overview = await analyticsRepository.getOverview(startDate);

        return {
            overview
        };
    },
};
