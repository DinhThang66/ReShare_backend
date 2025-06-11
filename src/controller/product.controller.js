import Product from "../models/Product.js";
import cloudinary from '../config/cloudinary.js';

export const createProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            title, description, pickupTimes, pickupInstructions,
            location_lat, location_lng, type, productType, originalPrice, 
            discountPercent, quantity, storeInfo 
        } = req.body

        const files = req.files;
        let imageUrls = [];

        if (files && files.length > 0) {
            for (const file of files) {
                // Upload từng ảnh sử dụng upload_stream để có URL
                await cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            console.error("Upload error:", error);
                            throw new Error("Upload failed");
                        }
                        imageUrls.push(result.secure_url);
                        if (imageUrls.length === files.length) {
                            saveProduct();
                        }
                    }
                ).end(file.buffer);
            }
        } else {
            await saveProduct();
        }

        async function saveProduct() {
            const newProduct = await Product.create({
                title, description,
                images: imageUrls,
                pickupTimes, pickupInstructions,
                location: {
                    type: "Point",
                    coordinates: [
                        parseFloat(location_lng),
                        parseFloat(location_lat)
                    ]
                },
                type, productType,
                originalPrice,
                discountPercent,
                quantity, storeInfo,
                createdBy: userId
            })
            const populatedProduct = await Product.findById(newProduct._id)
                .populate('createdBy', 'firstName lastName profilePic');
            return res.status(201).json(populatedProduct);
        }
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: error.message });
    }
}

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('createdBy', 'firstName lastName profilePic');
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Error getting product:", error);
        res.status(500).json({ message: error.message });
    }
}

export const getCategorizedProducts = async (req, res) => {
    try {
        const userLat = req.user.location.coordinates[1] || 21.005403;
        const userLng = req.user.location.coordinates[0] || 105.843048;
        const maxDistance = req.user.radius * 1000 || 3000;

        /*
        const locationFilter = {
            location: {
                $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [userLng, userLat] // [lng, lat]
                },
                $maxDistance: maxDistance
                }
            }
        };

        const [freeFood, nonFood, reducedFood, want] = await Promise.all([
            Product.find({
                type: "free",
                productType: "food",
                ...locationFilter
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("createdBy", "firstName lastName profilePic"),

            Product.find({
                productType: "non-food",
                ...locationFilter
            })
                .sort({ createdAt: -1 })
                .limit(20)
                .populate("createdBy", "firstName lastName profilePic"),

            Product.find({
                type: "reduced",
                productType: "food",
                ...locationFilter
            })
                .sort({ createdAt: -1 })
                .limit(20)
                .populate("createdBy", "firstName lastName profilePic"),

            Product.find({
                type: "wanted",
                ...locationFilter
            })
                .sort({ createdAt: -1 })
                .limit(20)
                .populate("createdBy", "firstName lastName profilePic")
        ]);
        */

        // Reusable aggregation function
        const getCategory = async (typeFilter = {}, limit = 20) => {
            return await Product.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [userLng, userLat]
                        },
                        distanceField: "distance",
                        maxDistance: maxDistance,
                        spherical: true,
                        query: typeFilter
                    }
                },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: "users",
                        localField: "createdBy",
                        foreignField: "_id",
                        as: "createdBy"
                    }
                },
                { $unwind: "$createdBy" },
                {
                    $project: {
                        title: 1,
                        description: 1,
                        images: 1,
                        distance: 1,
                        location: 1,
                        pickupTimes: 1,
                        pickupInstructions: 1,
                        originalPrice: 1,
                        discountPercent: 1,
                        quantity: 1,
                        type: 1,
                        productType: 1,
                        storeInfo: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        createdBy: {
                            _id: "$createdBy._id",
                            firstName: "$createdBy.firstName",
                            lastName: "$createdBy.lastName",
                            profilePic: "$createdBy.profilePic"
                        }
                    }
                }
            ]);
        };


        const [freeFood, nonFood, reducedFood, want] = await Promise.all([
            getCategory({ type: "free", productType: "food" }),
            getCategory({ productType: "non-food" }),
            getCategory({ type: "reduced", productType: "food" }),
            getCategory({ type: "wanted" })
        ]);


        res.status(200).json({ freeFood, nonFood, reducedFood, want });
    } catch (error) {
        console.error("Error fetching categorized products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getNearbyProducts = async (req, res) => {
    try {
        const searchQuery = req.query.q?.trim() || "";

        const userLat = req.user.location.coordinates[1] || 21.005403;
        const userLng = req.user.location.coordinates[0] || 105.843048;
        const maxDistance = req.user.radius * 1000 || 3000;
        const maxResults = 15;

        const products = await Product.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [userLng, userLat]
                    },
                    distanceField: "distance",
                    maxDistance: maxDistance,
                    spherical: true
                }
            },
            {
                 $match: {
                    title: { $regex: searchQuery, $options: "i" } // case-insensitive
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: maxResults },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy"
                }
            },
            { $unwind: "$createdBy" },
            {
                $project: {
                    title: 1,
                    description: 1,
                    images: 1,
                    distance: 1,
                    location: 1,
                    pickupTimes: 1,
                    pickupInstructions: 1,
                    originalPrice: 1,
                    discountPercent: 1,
                    quantity: 1,
                    type: 1,
                    productType: 1,
                    storeInfo: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    createdBy: {
                        _id: "$createdBy._id",
                        firstName: "$createdBy.firstName",
                        lastName: "$createdBy.lastName",
                        profilePic: "$createdBy.profilePic"
                    }
                }
            }
        ]);

        res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching nearby products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
