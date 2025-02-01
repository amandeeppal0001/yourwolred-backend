import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async(req, res)=> {
    const { page = 1, limit =10, query, sortBy, sortType, userId} = req.query
    //TODO: get all videos based on query, sort, pagination

    
    const videos = await Video.aggregate([
        {
            $match:{  //This is a MongoDB aggregation pipeline $match stage using a regular expression search across multiple fields:
                $or: [ //$or operator allows matching documents if either condition is true
                    {
                        title: { $regex: query, $options: "i"}, //$regex performs partial text matching
                    },
                    {
                        description: {   $regex: query, $options: "i" }, //$options: "i" makes the search case-insensitive
                    },
                ],
            },
            //Breakdown:

//Searches for query in either title or description
//Matches documents where the query appears anywhere in those fields
//Ignores letter case during matching
        },
        { $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "createdBy",
        },
        },
        {
            $unwind: "createdBy", //The $unwind stage in a MongoDB aggregation pipeline "deconstructs" an array field, creating a separate document for each array element.
        },
     /*   // Before unwind
{
    _id: 1,
    title: "Project",
    createdBy: ["Alice", "Bob"]
  }
  
  // After $unwind: "createdBy"
  [
    {
      _id: 1,
      title: "Project",
      createdBy: "Alice"
    },
    {
      _id: 1,
      title: "Project",
      createdBy: "Bob"
    }
  ]*/
        {
            $projects: {
                thumnail: 1,
                videoFile: 1,
                views:1,
                title: 1,
                description: 1,
                createdBy: {
                    username: 1,
                    fullName:1,
                    avatar: 1,
                },
            },
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
            //[sortBy] is a computed property name, which means the field to sort by will be dynamically determined by the value of sortBy
            //The sort direction is determined by a ternary operator:

/*If sortType is "asc", it uses 1 (ascending order)
If sortType is not "asc", it uses -1 (descending order)*/
        },
        {
            $skip: (page-1)*limit,
        },
        {
            $limit: parseInt(limit),
        },
        /*$skip: (page - 1) * limit

Skips documents based on current page number
Calculates offset: (current page - 1) * documents per page
Allows pagination by skipping earlier pages' documents

$limit: parseInt(limit)

Restricts output to specified number of documents
Converts limit to integer to ensure valid number
$skip: (2 - 1) * 10 },  // Skips first 10 documents
  { $limit: 10 }            // Returns next 10 documents
   $skip jumps to correct page
$limit retrieves specified number of documents
*/
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200,videos,"all videos fetched successfully"));
})



const publishVideo = asyncHandler(async(req, res)=>
{
    const {title,description} = req.body
    if((!title || !description)){
        throw new ApiError(400,"please provide title & description")
    }
  const videoFileLocalPath = req.files?.videoFile[0]?.path;

  if(!videoFileLocalPath){
    throw new ApiError(400,"video path isn't available")
  }
   const videoFile = await uploadOnCloudinary(videoFileLocalPath)
if(!videoFile.url){
    throw new ApiError(500,"error while uploading video on cloudinary")
}
const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
if(!thumbnailLocalPath){
    throw new ApiError(400, " plaease provide thumbnail");
}
const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
if(!thumbnail.url){
    throw ApiError(500,"error while uploading the thumbnail on cloudinary")
}
const video = Video.create({
videoFile: videoFile.url,
thumbnail: thumbnail.url,
title,
description,
dration:videoFile.duration,
owner: req.user._id
});
if(!video){
    throw new ApiError(500, "error while publishing the video");
}

return res
.status(200)
.json(200,video, "video published successfully");
});
// GET VIDEO BY ID
const getVideoById = asyncHandler(async(res, req)=> {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid video Id")
    }
   const video = await Video.findById(videoId)
   if(!video){
    throw new ApiError(404,"video haven't find")
   }

   return res 
        .status(200)
        .json(200,video,"video fetched successfully")
});
//UPDATE VIDEO
const updateVideo = asyncHandler(async(req, res)=>
{
     //TODO: update video details like title, description, thumbnail
    const {videoId} = req.params;
    const {title , description} = req.body;
    const newThumbnaiLocalPath = req.file?.path;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video ID");
    }
    if(!title || !description){
        throw new ApiError(400,"provide updated title & description")
    }
    if(!newThumbnaiLocalPath){
        throw new ApiError(200,"provide thumbnail file")
    }

    const video =await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "video not found");   
    }
    const user = req.user._id
    if(user !== video.owner ){
        throw new ApiError(403,"unauthorised request")
    }

    const deleteThumbnailResponse = await deleteFromCloudinary(video.thumbnail);
    if(deleteThumbnailResponse.result !== "ok"){
        throw new ApiError(500,"Error while deleting old thumbnail");
    }
    //DON'T DO THIS
    // const videoFile = req.files?.videoFile[0].path
    // if(!videoFile){
    //     throw new ApiError(400, "cannot able to get videoFile");
    // }
   
    
    const newThumbnail = await uploadOnCloudinary(newThumbnaiLocalPath);
    if(!newThumbnail.url){
        throw new ApiError(500,"error while uploading new thumbnail");
    }
// DON'T DO IT
    // const video = await uploadOnCloudinary(videoFile);
    // if(!video.url){
    //     throw new ApiError(500, "error while updloading video");   
    // }
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,{
          $set:{
            title,
            description,
            thumbnail: newThumbnail.url ,
          },
        },
        { new: true}
    );

    return res 
    .status(200)
    .json(new ApiError(200,updateVideo,"video details uplated successfully"));
    }
);

//DELETE VIDEO
const deleteVideo = asyncHandler(async(res,request)=> {
const {videoId} = req.params;
if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
const video = await Video.findById(videoId);

if(!video){
    throw new ApiError(400,"video  not found");
}
if (video.owner !== req.user._id) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }
const deleteThumbnail = await deleteFromCloudinary(video.thumbnail);
if(deleteThumbnail.result !== "ok"){
    throw new ApiError(500,"Error while deleting  thumbnail");
}
const deleteVideo = await deleteFromCloudinary(video.videosFile);
if(deleteVideo.result !== "ok"){
    throw new ApiError(500,"Error while deleting video");
}
const delet = await Video.findByIdAndDelete(videoId);

return res
.status(200)
.json(new ApiResponse(200, {}, "Video Deleted"));
})


const togglePublished = asyncHandler(async(res, req)=> {
    const videoId = req.params;

    if(!isObjectIdValid(videoId)){
        throw new ApiError(400,"video id is not valid");
    }
    const video = await Video.findById(videoId);
if(video.owner!== req.user._id){
throw new ApiError(403,"unauthorised request");
}
const togglePublished = await Video.findById(videoId,
    {
        $set:{
            isPublished: !video.isPublished 
        }
    },
    {
        new: true
    }
)
return res
    .status(200)
    .json(new ApiResponse(200,togglePublished,"togglePublished successfully"));
});
export{
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
    togglePublished,
    deleteVideo,
}
