import Comment from '../models/Comment.js'
import Post from '../models/Post.js'

export const addComment = async (req, res) => {
    const {content, postId} = req.body;
    try{
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:'Post not found'}); 
        }

        const comment = await Comment.create({
            content,
            postId,
            createdBy: req.user.id //Authenicated user
        });
        // Lấy lại comment vừa tạo, kèm populate user
        const fullComment = await Comment.findById(comment._id)
            .populate('createdBy', 'firstName lastName profilePic');

        res.status(201).json(fullComment);
    }catch (error){
        res.status(500).json({message:error.message});
    }
}

export const getCommentsbyPost = async (req, res) => {
    try{
        const comments = await Comment.find({postId: req.params.postId})
            .sort({ createdAt: 1 })
            .populate('createdBy',  'firstName lastName profilePic');
        res.status(200).json({comments:comments});
    }catch (error){
        res.status(500).json({message:error.message});
    }
}

export const toggleCommentLikes = async (req, res) => {
    try{
        const comment = await Comment.findById(req.params.id);
        if(!comment){
            res.status(404).json({message:"Comment not found"});
        }
        //Check if user already liked the comment
        const liked = comment.likes.includes(req.user.id);

        if(liked){
            //if liked, remove like
            comment.likes = comment.likes.filter((userId) => userId.toString() != req.user.id.toString());
        }else{
            //add like
            comment.likes.push(req.user.id);
        }
        await comment.save();
        res.json({likes:comment.likes.length, liked:!liked});
    }catch (error){
        res.status(500).json({message:error.message});
    }
}