import { z } from "zod";

export const aiAnalysisResultSchema = z.object({
    sentiment: z.enum([
        "ANGRY",
        "FRUSTRATED",
        "NEUTRAL",
        "SATISFIED",
    ], { error: "Sentimen tidak valid" }),
    suggestedPriority: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
    ], { error: "Prioritas yang disarankan tidak valid" }),
    suggestedCategory: z.enum([
        "PAYMENT",
        "ACCOUNT",
        "TECHNICAL",
        "SHIPPING",
        "PRODUCT",
        "OTHER",
    ], { error: "Kategori yang disarankan tidak valid" }),
    summary: z.string().trim().min(1, { error: "Ringkasan tidak boleh kosong" }).max(500, { error: "Ringkasan maksimal 500 karakter" }),
    reason: z.string().trim().min(1, { error: "Alasan tidak boleh kosong" }).max(1000, { error: "Alasan maksimal 1000 karakter" }),
    confidence: z.number().min(0, { error: "Confidence minimal 0" }).max(1, { error: "Confidence maksimal 1" }),
});

export const zEnvelopeSchema = z.object({
    choices: z.array(
        z.object({
            message: z.object({
                content: z.string().nullable(),
            }),
        }),
    ).min(1),
});

export const replySchema = z.object({
  reply: z.string().trim().min(1).max(5000),
});

export const responseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable(),
      }),
    }),
  ).min(1),
});

export type AIAnalysisResult = z.infer<typeof aiAnalysisResultSchema>;
