import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId} from "mongoose";
import {Subscription} from "../models/subscription.modal.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleSubscription =  asyncHandler(async(res,req) =>{
        const {channelId} = req.params;
        if(!channelId){
            throw new ApiError(400,"invalid channel id");
        }
        const subscribed = await Subscription.findOne(
            {
                $and: [
                    {channel:channelId}, {subscriber:req.user._id}
                ],
            },
        )
        if(!subscribed){
            const subscribe = await Subscription.findByIdAndUpdate(
                channelId,
                {
                    $set: {
                        subscriber: req.user._id,
                        channel: channelId,
                    }
                    
                }
            )
            if(!subscribe){
                throw new ApiError(500,"error while subscribing")
            }
            return res
            .status(200)
            .json(new ApiResponse(200,subscribe,"channel subscribed"))
        }
        const unsubscribe = await Subscription.findByIdAndDelete(subscribed._id)
        if(!unsubscribe){
            throw new ApiError(500,"error while unsubscribing")
        }
})
 

const getUserChannelSubscribers = asyncHandler(async(req, res)=> {
    const {subscriberId} = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"invalid subscriberId")
    }

    const subscriberList = await Subscription.aggregate([
        subscriberId,
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup:{
                from: "users",
                localFeild: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscriber:{
                    $first: "$subscriber",
                },
            },
        },
        {
            $project:{
                subscriber: 1,
                createdAt: 1,
            },
        },
   ] );

   if(!subscriberList){
    throw new ApiError(500, "Server Error while fetching subscribers list" );
   }

   return res
   .status(200)
   .json(new ApiResponse(200, subscriberList, " subscriber list fetched"));
});

const getSubscribedChannels = asyncHandler(async(req,res )=>{
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel id")
    }

    const channelList = await Subscription.aggregate([
       
        {
            $match:{
               subscriber: channelId,
            },
        },
        {
            $lookup:{
                from: "users",
                localFeild: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [ 
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1,

                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                channel:
                {
                    $first: "$channel",
                },
            },
        },
        {
            $projefct:{
                channel: 1,
                createdAt: 1,
            },
        },
]
    );

    if(!channelList){
        throw new ApiError(400, "error while fetching subscribed channels");
    }



return res
    .status(200)
    .json(new ApiResponse(200, channelList, "Subcribed channels fetched"));

});





export{
    toggleSubscription  ,
    getSubscribedChannels,
    getUserChannelSubscribers,
}