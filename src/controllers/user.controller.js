import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { user } from "../models/user.modal.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
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

    if([fullName,email, username ,password].some((field)=>
    field?.trim() === "")
) {
        throw new ApiError(400, "all fields are required")
    }

  const existedUser =  User.findOne({          // jo bhi first user find hooga use return kr dega
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, " user with this email or userName  already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    req.file?.coverImage[0]?.path;

     
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }
     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     if(!avatar){
        throw new ApiError(400, "Avatar filed rrequired ")
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
export { 
    registerUser,
 }
