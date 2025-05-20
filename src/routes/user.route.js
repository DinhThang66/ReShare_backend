import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    acceptFriendRequest,
    getFriendRequests,
    getMyFriends,
    getOutgoingFriendReqs,
    getRecommendedUsers,
    sendFriendRequest,
    getUser
} from "../controller/user.controller.js";

const router = Router()

router.get("/:id", getUser)

// apply auth middleware to all routes
router.use(protectRoute);   

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;