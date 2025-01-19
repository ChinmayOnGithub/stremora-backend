/* 
    id        string    pk
    video     ObjectId  videos
    comment   ObjectId  comments
    tweet     ObjectId  tweets
    likedBy   ObjectId  usersconst like = await Like.create({
    video: videoId,
    likedBy: user._id,
  // There should be no "content" field here if it's not part of the schema
});
    createdAt Date
    updatedAt Date
*/


import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        // either of `video`, `comment` and `tweet` will be assigned
        // rest will be null 
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet",
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true } // createdAt and updatedAt is added here
)

if (mongoose.models.Like) {
    delete mongoose.models.Like;
}

likeSchema.pre('save', function (next) {
    console.log(this.schema.paths);  // Logs the schema paths before saving
    next();
});

export const Like = mongoose.model("Like", likeSchema);