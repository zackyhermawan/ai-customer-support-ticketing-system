import { z } from "zod";

export const registerSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).trim().min(2, { error: "Nama minimal 2 karakter" }).max(100, { error: "Nama maksimal 100 karakter" }),
  email: z.string({ error: "Email wajib diisi" }).trim().email({ message: "Format email tidak valid" }).max(255, { error: "Email maksimal 255 karakter" }),
  password: z.string({ error: "Password wajib diisi" }).min(8, { error: "Password minimal 8 karakter" }).max(72, { error: "Password maksimal 72 karakter" }),
});

export const loginSchema = z.object({
  email: z.string({ error: "Email wajib diisi" }).trim().email({ message: "Format email tidak valid" }).max(255, { error: "Email maksimal 255 karakter" }),
  password: z.string({ error: "Password wajib diisi" }).min(8, { error: "Password minimal 8 karakter" }).max(72, { error: "Password maksimal 72 karakter" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;