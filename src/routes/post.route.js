import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPost, createPostFromUrl, getPosts, togglePostLikes } from '../controller/post.controller.js'
import { upload } from '../middleware/multer.middleware.js';

const router = Router();
router.use(protectRoute);  

//Only authenticated user can create post
router.post('/', upload.array('images'), createPost);
router.get('/', getPosts)
router.put('/:id/like', togglePostLikes);



router.post('/url', createPostFromUrl)   // Test
export default router;