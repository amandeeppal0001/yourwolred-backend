import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, {isValidObjectId} from "mongoose" ;
import {Playlist} from "../models/playlist.model";
import {Video} from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";

const createPlaylist = asyncHandler(async(req, res) => {
const {name, description} = req.body;

if(!name || !description){
    throw new ApiError(400,"all feilds are required ")
}

const existingPlaylist = await Playlist.findOne({
$and: [{name: name},{owner: req.user._id}] ,

});
if(existingPlaylist){
    throw new ApiError(404,"Playlist with this name is already exist")
}
const playlist = await  Playlist.create({
      name,
      description,
      owner: req.user._id,
});

if(!playlist){
    throw new ApiError(500, "Error while creating playlist");
}

return res
.status(200)
.json(new ApiResponse(200, playlist, "playlist created successfully"))
})


const getUserPlaylists = asyncHandler(async(req, res)=>{

    const { userId } = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID");
    }
    
    const userPlaylists = await Playlist.aggregate([
    {
    $match: {
        owner: new mongoose.Types.ObjectId(userId),
    },
},
    {
        $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    ForeignFeild: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                fullname: 1,
                            },
                        },
                    ],
                },
            },
               {
                $addFields:{
                    owner:{
                        $first: "$owner",
                    }
                    
                },
            },
            {
            $project: {
                thumbnail:1,
                title:1,
                owmer:1,
                description:1,
            },
        },
    ],
},
    },

          {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "createdBy",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            username:1,
                            fullname:1,
                        },
                    },
                ],
            },
          },
          {
            $addFields:{
                createdBy:{
                    $first: "$createdBy",
                },
            },
          },

        {
            $project:{
                videos:1,
                createdBy:1,
                name:1,
                description:1,
        },
    },
]).toArray();
if(userPlaylists.length === 0){
    throw new ApiError(500,"playlist not found")
}
return res 
    .status(200)
    .json(new ApiResponse(200,userPlaylists, "playlist fetched"));
});


const getPlaylistById = asyncHandler(async(req, res)=> {
   const {playlistId} = req.params;
   if(!isValidObjectId(playlistId)){
    throw new ApiError(400,"playlist not found");
   }
   const playlist = await Playlist.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(playlistId),
        },
    },
        {
            $lookup:{
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as:"createdBy",
                pipeline:[
                    {
                        $project:{
                            fullname:1 ,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields:{
                createedBy:
                {
                    $first: "$createdBy",
                },
            },
        },
        {
            $lookup:{
                from:"videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup:{
                            from:"user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullname:1 ,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                        {
                            $addFields:{
                                owner: {
                                    $first: "$owner",
                                }
                            },
                        },
                        {
                            $project:{
                            thumbnail:1,
                            title:1,
                            duration: 1 ,
                            views: 1,
                            owner: 1,
                           createdAt:1,
                           updatedAt: 1,
                        },
                    },
                    ],
                },
            },
        {
            $projecct:
            {
                videos: 1,
                 description: 1,
                 name: 1,
                 createdBy: 1,   
            },
        },
   ]);
   if(!playlist){
    throw new ApiError(500, " Error in fetching playlist");
   }
 return res
   .status(200)
   .json(new ApiResponse(200, playlist, "Playlist Fetched"));
});


const addVideoToPlaylist = asyncHandler(async(req, res)=>{
  const {videoId, playlistId} = req.params

  if(!isObjectIdValid(videoId) || !isObjectIdValid(playlistId)){
    throw new ApiError(400, "video id & playlist id are required")
  }

  const playlist = await Playlist.findById(playlistId);
  if(!playlist){
    throw ApiError(404,"playlist doesn't exists");
  }
    
     if(playlist.owner.toString() != req.user._id){
        throw ApiError(403,"you are not allowed to modify this playlist" )
     }

     

  const videoExists = await Playlist.filter(
    (video) => video.toString() === videoId
    );

if(!videoExists){
    throw ApiError(400,"video has been already added to playlist ");
  }
 const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
        $push: { videos: videoId } }, // Push videoId into the array
        { new: true }
 );
 if(!addVideo){
    throw new ApiError(500, "Error in adding video to server")
 }

 return res
    .status(200)
    .json(new ApiResponse(200,addVideo,"video added successfully"))
})

const deletePlaylist = asyncHandler(async(req, res )=> {
 const { playlistId } = req.params;
 const playlist = await Playlist.findById(playlistId);
if(!playlist){
    throw new ApiError(400,"playlist no")
}

if(playlist.owner.toString() !== req.user._id){
    throw new ApiError(403,"you are not allowed to delete playlist");
}

const deletePlaylist = Playlist.findByIdAndDelete(playlist._id);

return res
    .status(200)
    .json(new ApiResponse(200,{},"playlist deleted successfully"));
})
const updatePlaylist = asyncHandler(async(req, res)=> {
        const {playlistId } = req.params
        const {name, description }= req.body
        
        if(!name || !description ){
            throw new ApiError(400, "all feilds are required")
        }

        if(!isValidObjectId(playlistId)){
            throw new ApiError(400, "playlist id is invalid ")
        }
        const playlist  = await Playlist.findById(playlistId)
        if(!playlist){
            throw new ApiError(400, "playlist doesn't exist ")
        }
        
        if(playlist.owner.toString() !== req.user._id ){
            throw new ApiError(403, " you are not allowed to update playlist")
        }

        const updatePlaylist =  await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                },
            },
            {  new : true },
        );


if(!updatePlaylist){
    throw new ApiError(500,"error while updating playlist");
}
        
return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, " playlist updated successfully"))
});

const removeVideoFromPlaylist  = asyncHandler(async(req, res)=> {
       const {playlistId, videoId }= req.params;
       if(!isObjectIdValid(playlistId)){
        throw new ApiError(400, "playlistId is invlid");
       }

       if(!isObjectIdValid(videoId)){
        throw new ApiError(400, "videoId is invlid");
       }

       const playlist = await Playlist.findById(playlistId)
       if(!playlist ){
        throw new ApiError(400, "playlist is required")
       }
    if( playlist.owner.toString() !== req.user._id){
        throw new ApiError(403, "you are not allowded to delete playlist")
    }
    const videoExists = await playlist.videos.find((video) => 
        video.toString() === videoId);
    if(!videoExists){
        throw new ApiError(400,"video deosn't exists")
    }

    const modifiedPlaylistVideos = await playlist.videos.filter(
        (video)=> video.toString() !== videoId );


        const removeVideo = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    video: modifiedPlaylistVideos,
                },
            },
            {
                new: true
            },

        );

        if(!removeVideo){
            throw new ApiError(500, " server error while removing video ")
        }
    
    const deletePlaylist = await Playlist.findByIdAndDelete(playlist._id);
    if(!deletePlaylist){
        throw new ApiError(500, "server Error while deleting video")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,removeVideo,"video deleted successfully" ));
});

export{
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    deletePlaylist,
    updatePlaylist,
    removeVideoFromPlaylist ,
}