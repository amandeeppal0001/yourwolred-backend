import mongoose, {Schema} from "mongoosee";
const likeSchema = new Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref: "Video"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref: "User"
    }
})
 export const Like = mongoose.model("Like", likeSchema)