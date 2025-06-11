import { Router } from "express";

import { protectRoute } from "../middleware/auth.middleware.js";
import { createRequest } from "../controller/request.controller.js";

const router = Router()
router.use(protectRoute);

router.post("/", createRequest);

export default router;