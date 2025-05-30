import { Router } from "express";
import { register, login, logout, onboard, updateLocation } from '../controller/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = Router();

router.post("/register", register)
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);
router.patch("/update-location", protectRoute, updateLocation)

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});

export default router;

// put la update all
// patch la update 1 phan