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

export const getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id; 
        const requests = await Request.find({ requestedBy: userId })
        .populate({ path: 'productId',
            populate: {
                path: 'createdBy',
                select: 'firstName lastName email profilePic location radius',
            }
        });

        // Xử lý fallback location nếu bị lỗi hoặc rỗng
        const safeRequests = requests.map((request) => {
            const createdBy = request.productId?.createdBy;
            if (
                createdBy &&
                (typeof createdBy.location !== 'object' || !createdBy.location?.coordinates)
            ) {
                createdBy.location = {
                type: "Point",
                coordinates: [0.0, 0.0],
                };
            }

            return request;
        });

        return res.status(200).json(safeRequests);
    } catch (error) {
        console.error("Error fetching user requests:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getReceivedRequests = async (req, res) => {
    try {
        const userId = req.user.id; 
        // Find all products owned by this user
        const products = await Product.find({ createdBy: userId }).select('_id');
        const productIds = products.map(prod => prod._id);

        // Find all requests for those products
        const requests = await Request.find({ productId: { $in: productIds } })
            .populate({ path: 'productId',
                populate: {
                    path: 'createdBy',
                    select: 'firstName lastName email profilePic location radius',
                }
            })
            .populate('requestedBy', 'firstName lastName email profilePic location radius');

        // Xử lý fallback location nếu bị lỗi hoặc rỗng
        const safeRequests = requests.map((request) => {
            const requestedBy = request.productId?.requestedBy;
            if (
                requestedBy &&
                (typeof requestedBy.location !== 'object' || !requestedBy.location?.coordinates)
            ) {
                requestedBy.location = {
                    type: "Point",
                    coordinates: [0.0, 0.0],
                };
            }

            return request;
        });

        return res.status(200).json(safeRequests);
    } catch (error) {
        console.error("Error fetching received requests:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['accepted', 'rejected'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    try {
        const result = await Request.findByIdAndUpdate(id, { status });

        if (!result) {
        return res.status(404).json({ error: 'Request not found' });
        }

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
