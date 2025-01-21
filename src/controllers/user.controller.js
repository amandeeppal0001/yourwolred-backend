import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { upload } from "../middlewares/multer.middleware.js";

//ToDo user controller- this had been already teached by sir ,video controller, tweet controller, hospital management controller, upload videos, add video to watchlist & history of user , if user hits subscribe than how add subcriber to channel(& which field is required like user_id)

const generateAccessAndRefereshTokens = async(userId) =>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
     return {accessToken, refreshToken}
    }
    catch(error) {
        throw new ApiError(500, "something went wrong while generating access token & refresh token") 
    }
}
const registerUser = asyncHandler( async ( req, res) =>
{
    //get user details from frontend
    //validation - not empty check email
    //check if user already exists: username, email
    // check for images, check for avatar 
    // upload them to cloudinary, avatar
    // create user object - create entry in db 
    // remove password and refresh token field from response 
    // check for user creation 
    // return res
    
    const { fullName, email , username , password } = req.body
    console.log("email:", email);
    // console.log("req.body:", req.body);
    if([fullName,email, username ,password].some((field)=>
    field?.trim() === "")) {
        throw new ApiError(400, "all fields are required")
    }

  const existedUser = await  User.findOne({          // jo bhi first email ya username(user) me se  find hooga use return kr dega
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, " user with this email or userName  already exists")
    }
    // console.log("req.files:", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath ;
    if(req.files &&  Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

     
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }
     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     if(!avatar){
        throw new ApiError(400, "Avatar file required ")
     }

     const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // minus password and refreshToken from user object
    )

    if(!createdUser){
        throw new ApiError(500, "Somthing went wrong while registering user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succesfully")
    )
//    return res.status(200).json({
//         //
//     })
})

const loginUser = asyncHandler( async (req, res) => { 
    //req body -> data 
    // username or emal 
    // find the user 
    // check if user exists
    // check if password is correct
    // generate access token & refresh token
    // send cookie


    const {email , username, password } = req.body
    if(!email && !username){
        throw new ApiError(400, "username or email is required")
    }
// here is an alternative of above code based on logic discussion  
    //if(!(email || username)){
      //  throw new ApiError(400, "username or email is required")
    //}


    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw  new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){   
        throw new ApiError(401, "Invalid credentials")
    }
    const {accessToken,refreshToken}= await generateAccessAndRefereshTokens(user._id)

    // const loggedInUser  = await User.findById(user._id).select("-password -refreshToken")
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
// This is correct as both are exclusions.

     const options = {
        httpOnly: true, 
        secure: true
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie( "refreshToken", refreshToken, options)
     .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken, refreshToken
            },
            "User logged in successfully"
        )
     )
    })
    
// const logoutUser = asyncHandler(async(req, res )=>{
//  await  User.findByIdAndUpdate(
//     req.user._id,{
//         $set: {
//             refreshToken: undefined
//         }
//         },
//         {
//             new: true
//         }
// )
// const options = {
//     httpOnly: true, 
//     secure: true
//  }

//  return res
//  .status(200)
//  .clearCookie("accessToken", options)
//  .clearCookie("refreshToken", options)
//  .json(new ApiResponse(200, {}, "User logged Out"))
// })
const logoutUser = asyncHandler(async (req, res) => {
    // Update refresh token to undefined in the database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { 
                 refreshToken: 1   // this removes the field from document
            },
        },
        {
            new: true, // Return the updated document
        }
    );

    // Define cookie options
    const options = {
        httpOnly: true,
        secure: true, // Set true if using HTTPS
    };

    // Clear cookies and send a success response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async(req, res) => {
const incomingRefreshToken = req.cookies.
refreshToken || req.body.refreshToken

if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
}
try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )


    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }
    
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }
    
        const options = {
            httpOnly: true,
            secure: true
         }
    
         const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
         return res.status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token is refreshed"
            )
         )
} catch (error) {
    throw new ApiError(401, error?.message || 
        "Invalid refresh token"
    )
}
})
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


// const changeCurrentPassword = asyncHandler(async(req, res) =>{
//     const {oldPassword, newPassword , confPassword} = req.body
// // if(!(newPassword === confPassword)){   // to verify new password with  confirm password
// //     throw new ApiError(400, "confirm Password is not correct")
// // }
//     const user = await User.findById(req.user?._id)
//     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

//     if(!isPasswordCorrect){
//         throw new ApiError(400, "Invalid old Password")
//     }

//     user.password = newPassword
//     await user.save({validateBeforeSave: false})

//     return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Password changed successfully"))

// })


const getCurrentUser = asyncHandler(async(req,res)=>{
      return res
      .status(200)
      .json(new ApiResponse(200, req.user, "current user fetched successfully"))

}) 


const updateAccountDetails = asyncHandler(async(res, req) =>{
    const {fullName, email} = await req.body

    if (!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }
   const user =  User.findByIdAndUpdate(
        req.user?._id,
        {
        $set: {
            fullName,
            email: email
        }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading on avatar ")

    }
     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "avatar is updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file is missing")
    }

    // TODO delete old cover image - assignment 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading on cover image on cloudinary ")

    }
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
      ).select("-password")
      return res
      .status(200)
      .json(new ApiResponse(200, user, "cover image is updated successfully"))
})




const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers", // Renamed correctly
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);
    
    // const channel = await User.aggregate([
    // {
    //     $match: {
    //         username: username?.toLowerCase() 
    //     }
    // },
    //     {
    //         $lookup: {
    //             from: "subscriptions",
    //             localField: "_id",
    //             foreignField: "subscriber",
    //             as: "subscribedTo"
    //         }
    //         // $lookup: {
    //         //     from: "subscription",
    //         //     localfield: "_id",
    //         //     foreignField: "channel",
    //         //     as: "subscribers"
    //         // }
    //     },
    // {
    //     $lookup:{
    //         from: "subscriptions",
    //         localField: "_id",
    //         foreignField: "subscriber",
    //         as: "subscribedTo"
    //     }
    // },
    // {
    //     $addFields: {
    //         subscribresCount: {
    //             $size: "$subscribers"
    //         },
    //         channelsSubscribedToCount: {
    //             $size: "$subscribedTo"
    //         },
    //         isSubscribed:
    //         {
    //             $cond: {
    //                 if: {$in: [req.user?._id,"$subscribers.subscriber"]},
    //                 then: true,
    //                 else: false
    //             }
    //         }
    //     }
    // },
    // {
    //     $project: {
    //         fullName: 1,
    //         username: 1,
    //         subscribersCount: 1,
    //         channelsSubscribedToCount: 1,
    //         isSubscribed: 1,
    //         avatar: 1,
    //         coverImage: 1,
    //         email: 1
    //     }
    // }
    // ])

    if(!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res) =>{
    
  const user = await User.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
                }
    }, 

    {
        $lookup:{
            from: "videos",
            localField: "watchHistory" ,
            foreignField: "_id",
            as: "watchHistory", // field name = watchHistory & it will store id from video to watchHistory of users 
            pipeline: [
                    {
                        $lookup:{   // lookup will always return array , and our required answer will we first element of array
                            from:"users",  // users ke inside jayega
                            localField: "owner", //owner inside videos table ko users ki id se connect kr dega  
                            foreignField: "_id", // users ki id layega
                            as: "owner", // this will stores in owner field
                            pipeline: [           // also try to put this pipeline outside than see (conclusion: It will work)
                                {
                                    $project: {
                                        fullName: 1,  // array ke first element me ye tino store ho jayenge (fullnaem,username, avatar string)
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"  //it will return elementAtArray[0] or we can say first elment of array
                                        }
                                    }
                                }
                            ]
                        } 
                    }
            ]
        }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
         user[0].watchHistory,
          "Watch history fetched successfully")
        )
})
 

const addVideo = asyncHandler(async(req, res)=> {
    const videoLocalPath = req.user?.path
    if(!videoLocalPath){
        throw new ApiError(400,"video  is missing")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    if(!video.url){
        throw new AppiError(400, "ERROR: video isn't uploaded on cloudinary")
    }
    const user = await findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                videoFile: video.url
            }
        },
       {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "video uploaded successfully"))

})

const tweeter = asyncHandler(async(req,res)=>{
    const tweet = await req.body
    if(!tweet){
        throw new ApiError(400, "tweet is not given")
    }
    const dbTweet = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                tweet:dbTweet
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,dbTweet,"your tweet ha been tweeted successfuly"))
}/*,{timestamps:true}*/)

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
 changeCurrentPassword,
 getCurrentUser,
 updateAccountDetails,
 updateUserAvatar,
 updateUserCoverImage,
 getUserChannelProfile,
 getWatchHistory,
 addVideo,
 tweeter

 }
