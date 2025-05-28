import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true},
    description: { type: String, required: true, trim: true },
    images: [{ type: String }],
    pickupTimes: { type: String, required: true },
    pickupInstructions: { type: String },
    location_lat: { type: Number, required: true },
    location_lng: { type: Number, required: true },
    type: { type: String, enum: ['free', 'wanted', 'reduced', 'paid'], required: true },
    productType: { type: String, enum: ['food', 'non-food'], required: true },
    originalPrice: { type: Number, min: 0, 
        required: function () { return this.type === 'reduced' || this.type === 'paid'; }
    },
    discountPercent: { type: Number, min: 0, max: 100,
        required: function () { return this.type === 'reduced'; }
    },
    quantity: { type: Number, min: 1, default: 1,
        required: function () { return this.type === 'reduced'; }
    },
    storeInfo: { type: String, required: function () { return this.type === 'reduced'; } },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

const Product = mongoose.model("Product", productSchema);
export default Product;