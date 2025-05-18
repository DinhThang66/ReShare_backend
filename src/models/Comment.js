import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    postId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post",
        required:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
}, { timestamps: true })

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;