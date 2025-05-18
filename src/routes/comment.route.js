import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { addComment, getCommentsbyPost, toggleCommentLikes } from '../controller/comment.controller.js'

const router = Router()
router.use(protectRoute);  

router.post('/', addComment);
router.put('/:id/like', toggleCommentLikes);
router.get('/:postId', getCommentsbyPost);


export default router