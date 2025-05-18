import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    images: [{ type: String }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
}, { timestamps: true })

const Post = mongoose.model("Post", postSchema);
export default Post;