import { Queue } from "bullmq";
import { redis } from "../../lib/redis.js";

export const AI_ANALYSIS_QUEUE = "ai-ticket-analysis";

export type AIAnalysisJobData = {
    ticketId: string;
    analysisId: string;
};

export const aiAnalysisQueue = new Queue<AIAnalysisJobData>(
    AI_ANALYSIS_QUEUE,
    {
        connection: redis,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
            removeOnComplete: {
                count: 1000,
            },
            removeOnFail: {
                count: 5000,
            },
        },
    },
);
