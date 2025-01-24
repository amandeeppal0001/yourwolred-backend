import mongoose from "mogoose"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/model.js"
// get video comments
const getVideoComments = asyncHandler( async (req, res) => {
const { videoId } = req.params
const  {  page = 1,  limit = 10 } = req.query;

const video = await Video.findById(videoId);
if(!video){
    throw new ApiError(404, "video is not found")
}

const options = {
    page,
    limit
};

const comments = await Comment.aggregate([
    
  { $match:{
        video: new mongoose.Types.ObjectId(videoId),
   },
},
   {
    $lookup:{
        from:"users",
        localFeild: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline:[
           { $projects: {
            username: 1,
            fullName: 1,
            avatar: 1,

           },

           },
        ],
    },
       
    },
{
    $addFields:{
        createdBy:
        {
            $first: "$createdBy",
        },
        
    },
},
  {
    $unwind: "$createdBy",
  },
  {
        $project: {
         content:1,
         createdBy:1,
        },
    },
    {
        $skip: (page -1)*limit,
    },
    {
        $limit: parseInt(limit),
    },
  
   
]);

return res
.status(200)
.json(new ApiResponse(200,comments,"video comments fetched"));
});

// Add a comment to a video

const addComment = asyncHandler(async(req, res) => {
    const {videoId } = req.params;
    const { content }= req.body;
    const user = req.user._id;
    if(!content){
        throw new ApiError(400,"Comment content is missing")
    }
   const video =  await Video.findById("videoId");
   if(!video){
    throw new ApiError(404," video not found");
   }
   const comment = Comment.create({
    content,
    video: videoId,
    owner: user,
   });
   if(!comment ){
    throw new ApiError(500,"error while saving the comment");
   }

   return res
   .status(201)
   .json(new ApiResponse(200, comment," comment saved"))
})
  
const updateComment = asyncHandler(async(req, res) => {
  const {content} = req.body
if(!content){
    throw new ApiError(404,"content not found")
}
const {commentId} = req.params
const user = req.user._id;


  const originalComment = await Comment.getByIdAndUpadate(commentId);
if(!originalComment){
    throw new ApiError(400,"comment not found")
}
if(originalComment.owner !== user){
    throw new ApiError(403,"unauthorised access");
}
const updateComment = await Comment.findByIdAndUpdate(
    commentId,{
        $set:{
          content,
        },
    },
    {
        new: true
    }
);
if(!updateComment){
    throw new ApiError(500,"error while updating comment, server Error")
}

return res
.status(200)
.json(new ApiResponse(200, updateComment, "comment updated"));
});
// DELETE comment 
const deleteComment = asyncHandler(async(req,res)=> {
    const {commentId} = req.params;
  // NEVER DONE IT AGAIN  // if(!commentId){
    //     throw new ApiError(400,"comment don't exist ");
    // }
    const user = req.user._id;
    const originalComment = await Comment(findById(commentId));
    if(!originalComment){
        throw new ApiError(404,"comment not found");

    }
    if(originalComment.owner !== user){
        throw new ApiError(404, "unauthorised request: you don't have permission to delete this comment")
    }
    // const deleteComment = await Comment.findByIdAndUpdate(
    //     commentId,
    //     {
    //         $unset: {
    //             content: 1
    //         },
    //     },
    //     {new: true},
    // );
    const deleteComment  = await Comment.findByIdAndDelete(commentId);
    if(!deleteComment){
        throw new ApiError(500, "Error while deleting the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,deleteComment,"comment deleted"));
});



export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
}