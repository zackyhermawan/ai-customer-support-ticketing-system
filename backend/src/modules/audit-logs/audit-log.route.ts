import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { findAll } from "./audit-log.controller.js";

const router = Router()

router.get("/", authenticate, authorize('ADMIN'), findAll)

export default router