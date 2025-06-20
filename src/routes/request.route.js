import { Router } from "express";

import { protectRoute } from "../middleware/auth.middleware.js";
import { createRequest, getMyRequests, getReceivedRequests, updateRequestStatus } from "../controller/request.controller.js";

const router = Router()
router.use(protectRoute);

router.post("/", createRequest);
router.get("/mine", getMyRequests)
router.get("/received", getReceivedRequests)
router.patch('/:id/status', updateRequestStatus);


export default router;