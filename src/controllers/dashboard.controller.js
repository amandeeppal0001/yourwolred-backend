import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async(req, res)=> {
  const userId = req.user?._id;

  const videoCount = await Video.aggregate([
    {
        $match:{
            owner: new mongoose.Types.ObjectId(userId),
        },
    },
       {
         $group:{
           _id: "$videoFile",
            totalViews:{
                $sum: "$views",
                },
                totalVideos:{
                    $sum: 1,
                },
            },
       },
    {
        $project: {
            _id: 0,
            totalViews: 1,
            totalVideos: 1,
          }, 
    },
     
]);

const subsCount = await Subscription.aggregate([
    {
        $match:{
         channel: new mongoose.Types.ObjectId(userId),
        },
    },
    {
        $group:{
            _id: null,// _id: The grouping key (set to null here to combine all results into one group).
            totalSubscribers:{
                $sum: 1, //totalSubscribers: A new field calculated by summing 1 for every document, effectively counting all documents in the group.
            },
        },
    },
    {
        $project:{
            _id: 0,
            totalSubscribers: 1,
        },
    },
]);

const likeCount = await Like.aggregate([
    {
        $lookup:{
            from:"videos",
            Localfield: "video",
            foreignField: "_id",
            as: "videoInfo"
        },
    },
    {
        $lookup:{
            from: "tweets",
            localField: "tweet",
            foreignField: "_id",
            as: "tweetInfo"
        },
    },
    {
            $lookup:{
                from: "comments",
                localFeilds: "comment",
                foreignField: "_id",
                as: "commentInfo"
        },
    },
    {
    $match:{
        $or:[
            {
                "videoInfo.owner" : new mongoose.Types.ObjectId(userId)
            },
            {
                "tweetInfo.owner" : new mongoose.Types.ObjectId(userId)

            },
        {
            "commentInfo.owner" : new mongoose.Types.ObjectId(userId)

        },
        ],
    },
    },
    {
        $group:{
            _id:null,
            totalLikes:{
                $sum: 1,
            },
        },
    },
    {
        $project:{
            _id: 0,
            totalLikes: 1,
        },
    },

]);
const info = {
    totalViews: videoCount[0].totalViews,
    totalVideos: videoCount[0].totalVideos,
    totalSubscribers: subsCount[0].totalSubscribers,
    totalLikes: likeCount[0].totalLikes,
};

return res
    .status(200)
    .json(new ApiResponse(200, info, "Channel stats fetched"));

});


const getChannelVideos = asyncHandler(async(req, res)=>{
    const userId = req.user?._id
    const videos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project:{
                videoFile: 1,
                owner: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                views:1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,

            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200,videos, "channel videos fetched succefully" ));
});
export{
    getChannelStats,
    getChannelVideos
};