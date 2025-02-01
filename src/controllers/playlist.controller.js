import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, {isValidObjectId} from "mongoose" ;
import {Playlist} from "../models/playlist.model"
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
})