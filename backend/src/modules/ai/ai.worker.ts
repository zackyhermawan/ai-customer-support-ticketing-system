import { Worker } from "bullmq";
import { redis } from "../../lib/redis.js";
import { aiRepository } from "./ai.repository.js";
import { aiService } from "./ai.service.js";
import { AI_ANALYSIS_QUEUE, type AIAnalysisJobData } from "./ai.queue.js";
import { AppError } from "../../lib/app-error.js";

export const aiWorker = new Worker<AIAnalysisJobData>(
    AI_ANALYSIS_QUEUE,
    async (job) => {
        const { ticketId, analysisId } = job.data;

        await aiRepository.markProcessing(analysisId);

        const ticket = await aiRepository.findTicketForAnalysis(ticketId);

        if (!ticket) {
            throw new AppError(404, `Ticket ${ticketId} tidak ditemukan`);
        }

        const analysis = await aiService.analyzeTicket(ticket);

        await aiRepository.markCompleted(analysisId, analysis);

        console.log(`Analisis AI berhasil untuk tiket: ${ticketId}`);

        return { analysisId };
    },
    {
        connection: redis.duplicate(),
        concurrency: 3,
    },
);

aiWorker.on("completed", (job) => {
    console.log(`AI job ${job.id} completed`);
});

aiWorker.on("failed", (job, error) => {
    console.error(`AI job ${job?.id} failed:`, error.message);

    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade >= maxAttempts) {
        void aiRepository.markFailed(job.data.analysisId, error.message).catch((dbError) => {
            console.error("Failed to save AI failure status:", dbError);
        });
    }
});

aiWorker.on("error", (error) => {
    console.error("AI worker error:", error.message);
});
