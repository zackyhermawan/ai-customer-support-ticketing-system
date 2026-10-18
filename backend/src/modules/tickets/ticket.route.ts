import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { findTicketAnalyses } from "../ai/ai-analysis.controller.js";
import { discardDraft, findDrafts, generateDraft, sendDraft } from "../ai/ai-reply.controller.js";
import { assign, create, createMessage, findAll, findById, findMyTickets, markAsRead, updatePriority, updateStatus } from "./ticket.controller.js";

const router = Router()

router.use(authenticate)

router.post("/", authorize("CUSTOMER"), create);
router.get("/my", authorize("CUSTOMER"), findMyTickets);
router.post("/:id/read", markAsRead)

router.get("/", authorize("ADMIN"), findAll);
router.get("/:id/ai-analysis", authorize('ADMIN'), findTicketAnalyses)
router.patch("/:id/status", authorize("ADMIN"), updateStatus);
router.patch("/:id/priority", authorize("ADMIN"), updatePriority);
router.patch("/:id/assign", authorize("ADMIN"), assign);

router.post("/:id/ai-replies/drafts", authorize("ADMIN"), generateDraft);
router.get("/:id/ai-replies/drafts", authorize("ADMIN"), findDrafts);
router.post("/:id/ai-replies/drafts/:draftId/send", authorize("ADMIN"), sendDraft);
router.delete("/:id/ai-replies/drafts/:draftId", authorize("ADMIN"), discardDraft);

router.get("/:id", findById);
router.post("/:id/messages", createMessage);

export default router