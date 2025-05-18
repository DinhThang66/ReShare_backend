import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPost, getPosts, togglePostLikes } from '../controller/post.controller.js'

const router = Router();

//Only authenticated user can create post
router.post('/', protectRoute, createPost)
router.get('/', protectRoute, getPosts)
router.put('/:id/like', protectRoute, togglePostLikes);


export default router;