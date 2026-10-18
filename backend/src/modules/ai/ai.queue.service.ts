import { aiAnalysisQueue } from "./ai.queue.js";
import { aiRepository } from "./ai.repository.js";

export async function enqueueTicketAnalysis(ticketId: string) {
    let analysisId: string | undefined;

    try {
        const analysis = await aiRepository.createPending(ticketId);
        analysisId = analysis.id;

        await aiAnalysisQueue.add(
            "analyze-ticket",
            {
                ticketId,
                analysisId,
            },
            {
                jobId: analysisId,
            },
        );

        console.log(`Analisis AI sedang dalam antrian untuk ${ticketId}`);
    } catch (error) {
        console.error(`Gagal memasukkan analisis AI untuk tiket ${ticketId}:`, error,);

        if (analysisId) {
            try {
                await aiRepository.markFailed(analysisId, "Gagal menambahkan analisis AI ke antrian. Periksa Redis dan log backend.");
            } catch (dbError) {
                console.error("Gagal memperbarui status analisis AI:", dbError);
            }
        }
    }
}
