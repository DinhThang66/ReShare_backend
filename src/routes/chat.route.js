import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken } from "../controller/chat.controller.js";

const router = Router();
router.get("/token", protectRoute, getStreamToken);

export default router;