import Post from '../models/Post.js'
import cloudinary from '../config/cloudinary.js';

export const createPostFromUrl = async (req, res) => {
    try{
        const { content, images} = req.body; //expect images to be an array of Urls
        const createdBy = req.user.id // auth users

        //Create new post with content  and image urls and user id

        const newPost = new Post({ content, images,createdBy});
        await newPost.save();
        res.status(201).json(newPost);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

export const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const LIMIT = 10
        const skip = (page - 1) * LIMIT
        const userId = req.user.id; 

        // Tổng số bài post
        const totalPosts = await Post.countDocuments()

        const posts = await Post.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: LIMIT },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments"
                }
            },
            {
                $addFields: {
                    commentsCount: { $size: "$comments" }
                }
            },
            {
                $project: {
                    comments: 0,              // Ẩn mảng comment
                }
            }
        ])

        // Populate createdBy (vì aggregate không hỗ trợ populate trực tiếp)
        const populatedPosts = await Post.populate(posts, {
            path: "createdBy",
            select: "firstName lastName profilePic"
        });

        // Add likesCount & likedByCurrentUser
        const formattedPosts = populatedPosts.map(post => {
            const likedByCurrentUser = post.likes?.some(
                id => id.toString() === userId
            );

            const postObj = {
                ...post,
                likesCount: post.likes?.length || 0,
                likedByCurrentUser
            };
            delete postObj.likes;   // Xoá mảng likes không cần thiết

            return postObj;
        });


        res.status(200).json({
            posts: formattedPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / LIMIT)
        });
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

export const togglePostLikes = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            res.status(404).json({message:"Post not found"});
        }
        //Check if user already liked the comment
        const liked = post.likes.includes(req.user.id);

        if(liked){
            //if liked, remove like
            post.likes = post.likes.filter((userId) => userId.toString() != req.user.id.toString());
        }else{
            //add like
            post.likes.push(req.user.id);
        }
        await post.save();
        res.json({likes:post.likes.length, liked:!liked});
    }catch (error){
        res.status(500).json({message:error.message});
    }
}

export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id

        const files = req.files;
        let imageUrls = [];


        if (files && files.length > 0) {
            for (const file of files) {
                const result = await cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },  (error, result) => {
                        if (error) {
                            console.error('Upload error:', error);
                            throw new Error('Upload failed');
                        }
                        imageUrls.push(result.secure_url);
                        if (imageUrls.length === files.length) {
                            savePost();
                        }
                    }).end(file.buffer); // gửi buffer lên Cloudinary
            }
        } else {
            savePost(); // nếu không có ảnh, chỉ lưu text
        }

        async function savePost() {
            const newPost = await Post.create({
                content,
                images: imageUrls,
                createdBy: userId,
            });

            // Populate thêm thông tin user
            const populatedPost = await Post.findById(newPost._id)
                .populate('createdBy', '_id firstName lastName profilePic');

            return res.status(201).json({
                ...populatedPost.toObject(),
                commentsCount: 0,
                likesCount: 0,
                likedByCurrentUser: false
            });
        }

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
