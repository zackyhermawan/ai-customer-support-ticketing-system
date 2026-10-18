import express from "express";
import cors from "cors";
import healthRoute from "./routes/health.route.js";
import authRoute from "./modules/auth/auth.route.js"
import ticketRoute from "./modules/tickets/ticket.route.js"
import analyticRoute from "./modules/analytics/analytic.route.js"
import auditLogRoute from "./modules/audit-logs/audit-log.route.js"
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "AI Customer Support API"
  });
});

app.use("/api/health", healthRoute);
app.use("/api/auth", authRoute);
app.use("/api/tickets", ticketRoute);
app.use("/api/analytics", analyticRoute);
app.use("/api/audit-logs", auditLogRoute);

app.use(errorMiddleware)

export default app;
