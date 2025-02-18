// import mongoose, {Schema} from "mongoose";
// import jwt from "jsonwebtoken"
// import bcrypt from "bcrypt"


import mongoose,{Schema} from"mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    username: {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,// REMOVE the whitesapces
        index: true,// for faster search( when to apply search) ,& don't use it in another case
    },
    email: {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName: {
        type:String,
        required:true,
        trim:true,
        index: true,
    },
    avatar: {
        type:String, // cloudinary ka url use krenge
        required:true,
    },
    coverImage: {
        type:String,
    },
    watchHistory: [
        {
            type:Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required:[
            true,
            "Password is required"
        ]
    },
    refreshToken: {
        type: String,
    }
},{timestamps:true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password"))        return next();
    
      this.password = await bcrypt.hash(this.password, 10)
      next()
})


userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return  jwt.sign(
        {
            _id:this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
 

    return  jwt.sign(  // jwt.sign encode the data by taking id  ,  process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRY & genereate token
        {
            _id: this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
// export const User = mongoose.modal("User", userSchema)

export const User = mongoose.model("User", userSchema)
// jwt is a bearer token