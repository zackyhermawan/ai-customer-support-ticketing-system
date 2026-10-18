import { z } from "zod";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number({ error: "Halaman harus berupa angka" }).int({ error: "Halaman harus berupa bilangan bulat" }).min(1, { error: "Halaman minimal 1" }).default(1),
  limit: z.coerce.number({ error: "Batas data harus berupa angka" }).int({ error: "Batas data harus berupa bilangan bulat" }).min(1, { error: "Batas data minimal 1" }).max(100, { error: "Batas data maksimal 100" }).default(10),
  action: z.string({ error: "Action harus berupa teks" }).trim().min(1, { error: "Action tidak boleh kosong" }).max(100, { error: "Action maksimal 100 karakter" }).optional(),
  ticketId: z.string({ error: "ID tiket harus berupa teks" }).trim().min(1, { error: "ID tiket tidak boleh kosong" }).optional(),
  actorId: z.string({ error: "ID aktor harus berupa teks" }).trim().min(1, { error: "ID aktor tidak boleh kosong" }).optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;