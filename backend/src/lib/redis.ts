
import { Redis } from "ioredis";
import { env } from "../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (error: any) => {
    console.error("Redis connection error:", error.message);
});
