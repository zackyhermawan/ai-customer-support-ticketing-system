
import { z } from "zod";

const ticketCategories = [
  "PAYMENT",
  "ACCOUNT",
  "TECHNICAL",
  "SHIPPING",
  "PRODUCT",
  "OTHER",
] as const;

const ticketStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const;

const ticketPriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export const createTicketSchema = z.object({
  subject: z.string({ error: "Subjek tiket wajib diisi" }).trim().min(5, { error: "Subjek tiket minimal 5 karakter" }).max(150, { error: "Subjek tiket maksimal 150 karakter" }),
  description: z.string({ error: "Deskripsi tiket wajib diisi" }).trim().min(10, { error: "Deskripsi tiket minimal 10 karakter" }).max(5000, { error: "Deskripsi tiket maksimal 5000 karakter" }),
  category: z.enum(ticketCategories, {error: "Kategori tiket tidak valid"}).default("OTHER"),
});

export const ticketListQuerySchema = z.object({
  page: z.coerce.number({ error: "Halaman harus berupa angka" }).int({ error: "Halaman harus berupa bilangan bulat" }).min(1, { error: "Halaman minimal 1" }).default(1),
  limit: z.coerce.number({ error: "Batas data harus berupa angka" }).int({ error: "Batas data harus berupa bilangan bulat" }).min(1, { error: "Batas data minimal 1" }).max(100, { error: "Batas data maksimal 100" }).default(10),
  status: z.enum(ticketStatuses, {error: "Status tiket tidak valid"}).optional(),
  priority: z.enum(ticketPriorities, {error: "Prioritas tiket tidak valid"}).optional(),
  category: z.enum(ticketCategories, {error: "Kategori tiket tidak valid"}).optional(),
  search: z.string().trim().max(100, { error: "Pencarian maksimal 100 karakter" }).optional(),
});

export const createMessageSchema = z.object({
  body: z.string({ error: "Pesan wajib diisi" }).trim().min(1, { error: "Pesan tidak boleh kosong" }).max(5000, { error: "Pesan maksimal 5000 karakter" }),
  isInternal: z.boolean({ error: "Status pesan internal harus berupa boolean" }).default(false),
});

export const updateStatusSchema = z.object({
  status: z.enum(ticketStatuses, {error: "Status tiket tidak valid"}),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(ticketPriorities, {error: "Prioritas tiket tidak valid"}),
});

export const assignTicketSchema = z.object({
  assignedToId: z.string({ error: "ID admin harus berupa teks" }).min(1, { error: "ID admin tidak boleh kosong" }).nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ListQuery = z.infer<typeof ticketListQuerySchema>;
export type MessageInput = z.infer<typeof createMessageSchema>;
export type StatusInput = z.infer<typeof updateStatusSchema>;
export type PriorityInput = z.infer<typeof updatePrioritySchema>;
export type AssignInput = z.infer<typeof assignTicketSchema>;