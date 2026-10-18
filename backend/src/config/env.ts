import dotenv from "dotenv"

dotenv.config()

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
