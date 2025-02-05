import mongoose, {isValidObjectId} from "moongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async(req,res)=>{
    const { content } = req.body;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id")
    }
    const tweet = await Tweet.create(
        {
            content,
            owner: req.user._id,
        }
    );
    if(!tweet){
        throw new ApiError(400," error while creating tweet")
    }

    return res
    .status(200)
    .json(200,tweet,"tweet creared");
})

const getUserTweets = asyncHandler(async(req,res)=>{
    const{userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid userId")
    }
    const tweets = await Tweet.find(
         { owner: userId });

         if(!tweets.lenght === 0){
            throw new ApiError(400, "no tweets found");
         }

         return res 
         .status(200)
         .json(new ApiResponse(200,tweets,"tweets fetched successfully"))
});

const updateTweet = asyncHandler(async(req, res)=>{
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"content is required")
    }
    const { tweetId }= req.params;

        const tweet = await Tweet.findById(tweetId)
        if(!tweet){
            throw new ApiError(400,"invalid tweetId")
        }
       const owner = req.user._id;
        if(!tweet?.owner !== owner){
           throw new ApiError(400, " you are not alloweded to update tweet")
        }
    const modifiedTweet  = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
            {new: true},
    );
  

    return res
    .status(200)
    .json(new ApiResponse(201,modifiedTweet ,"tweet updated"))

});


const deleteTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweetId")
    }

    const user = req.user._id;
    const tweet = await Tweet.findOne(tweetId);
    if(!tweet){
        throw new ApiError(404, "  tweet not found")
    }
    if( tweet?.owner !== user){
        throw new ApiError(403,"you are not allowded to delete tweet")
    } 
    const response = await Tweet.findByIdAndDelete(tweetId);

    if(!response){
        throw new ApiError(400, " error while deleting the tweet")
    }

    return res
    .status(200)
    .json(200, {}, "tweet deleted successfully")
}) ;

export{
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}