import Request from "../models/Request.js";
import Product from "../models/Product.js";

export const createRequest = async (req, res) => {
    try {
        const { productId, pickupTime, message } = req.body;
        const userId = req.user.id; 

        if (!productId || !pickupTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Prevent duplicate requests
        const existing = await Request.findOne({ productId, requestedBy: userId });
        if (existing) {
            return res.status(400).json({ message: "You already requested this item" });
        }

        const newRequest = new Request({
            productId,
            requestedBy: userId,
            pickupTime,
            message
        });

        await newRequest.save();

        res.status(201).json({ message: "Request created successfully", request: newRequest });
    } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};