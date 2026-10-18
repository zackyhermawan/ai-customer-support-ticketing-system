import { createServer } from "node:http";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { initSocket } from "./lib/socket.js";
import app from "./app.js";
import { redis } from "./lib/redis.js";
import { aiAnalysisQueue } from "./modules/ai/ai.queue.js";
import { aiWorker } from "./modules/ai/ai.worker.js";

const server = createServer(app);

initSocket(server);

server.listen(env.PORT, () => {
  console.log(`API running at http://localhost:${env.PORT}`);
  console.log(`Socket.IO ready on port ${env.PORT}`);
});

async function shutdown() {
  console.log("Shutting down server...");

  server.close(async () => {
    await aiWorker.close();
    await aiAnalysisQueue.close();
    await redis.quit();
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
