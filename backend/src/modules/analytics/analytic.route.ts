import { Router } from "express";
import { getOverview } from "./analytic.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router()

router.get("/overview", authenticate, authorize('ADMIN'), getOverview)

export default router