import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Like } from "../models/like.model";
import mongoose, { isValidObjectId, isvalidObjectId } from "mongoose"

const toggleVideoLike = asyncHandler(async(req, res)=>
{
   const {videoId} = req.params;
    if(!isvalidObjectId(videoId)){
        throw new ApiError(400," invalid videoId");
    }
    
    const user = req.user._id;
    const likedVideo = await Like.findOne({
        $and:[{  video: videoId}, { user: user}],
    });

    if(!likedVideo){
        const like = await Like.create({
            video: videoId,
            likedBy: user ,

        });
        if(!like){
            throw new ApiError(500, "Error while liking the video");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, like, "user  liked video successfully"));
    }
  const unlikeVideo = await Like.findByIdAndDelete(likedVideo._id);
    if(!unlikeVideo){
        throw new ApiError(500, "Error while unliking the video");
    }
  return res
  .status(200)
    .json(new ApiResponse(200, unlikeVideo, "video unliked successfully"));
});

const toggleCommentLike = asyncHandler(async(req, res)=>
{
  const {commentId} = req.params;
  if(!isValidObjectId(commentId)){
    throw new ApiError(400,"invalid comment Id");
  }
  const user = req.user._id;
  const likedComment = await Like.findOne(
    {
        $and:[{comment:commentId },{likedBy:user}],
    }
  );
  if(!likedComment){
    const comment = await Like.create(
        {comment: commentId,
        likedBy: user,}
    );
    if(!comment){
        throw new ApiError(500, "errror in liking comment");
    }
    return res
    .status(200)
    .json(200,comment,"comment liked by user successfully");
  }
  const unlikeComment = await Like.findByIdAndDelete(likedComment._id)
  if(!unlikeComment){
    throw new ApiResponse(500,"error in deleting the comment");
  }
  return res
  .status(200)
  .json(new ApiResponse(200,unlikeComment,"comment unliked"));
});
const toggleTweetLike = asyncHandler(async(req,res)=>{
    const { tweetId} =req.params
    if(!isvalidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id")
    }
 const user = req.user._id
  const likeTweet = await Like.findOne({
    $and:[{tweet:tweetId},{likedBy:user}]
  })
  if(!likeTweet){
        const tweet = await Like.create(
            {
                tweet: tweetId,
                likedBy: user,
            }
        )
        if(!tweet){
            throw new ApiError(500,"error while liking tweet")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,"tweet liked successfully"));
  }

  const unlikeTweet = await Like.findByIdAndDelete(likeTweet._id);
  if(!unlikeTweet){
    throw new ApiError(500, "error while unliking tweet")
  }
  return res
  .status(200)
  .json(new ApiResponse(200, "unlike tweet successfully"));
});

const getLikedVideos = asyncHandler(async(req, res) =>{
    
    const likedVideos = await Like.aggregate([
       { 
        $match:{
         likedBy: new mongoose.Types.ObjectId(req.user._id),
         video: {$exists: true, $ne: null}, 
        },
    },
    
    {
        $lookup:{
              from:"videos",
              localFeild: "video",
              foreignFeild:"_id",
              as: "video",
              pipeline:[
                {
                    $lookup: {
                        from: "users",
                        localFeild: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:[
                            {
                                $project: {
                                    avatar: 1,
                                    username: 1,
                                    fullname: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    $addFields: { //Purpose: Since the $lookup produces an array, this extracts the first element from the owner array and stores it back in owner.
                        owner: {
                            $first: "$owner",
                        },
                    },
                },
                {
                    $projects: {
                        videoFile: 1,
                        thumbnail: 1,
                        title: 1,
                        duration: 1,
                        views: 1,
                        owner: 1,
                    },
                },
              ],
        },
    },
    {
        $unwind: "$video" ,//Purpose: Converts the video array (produced by the first $lookup) into individual documents, ensuring each Like document corresponds to a single video document.

    },
    {
        $project: { //Purpose: Reduces the document size further by including only the video and likedBy fields in the final result.
            video:1,
            likedBy:1,
        },
    },
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Fetched liked Videos"))
});


export{
    toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos
};