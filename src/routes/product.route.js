import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from '../middleware/multer.middleware.js';
import {
    createProduct,
    getProduct,
    getCategorizedProducts,
    getNearbyProducts
} from "../controller/product.controller.js"

const router = Router();
router.use(protectRoute);

router.post("/", upload.array("images"), createProduct);
router.get("/categorized", getCategorizedProducts);
router.get("/", getNearbyProducts)
router.get("/:id", getProduct)

export default router;


