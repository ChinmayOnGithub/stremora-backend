/* 
    id string pk
    video ObjectId videos
    owner ObjectId users
    content string
    createdAt Date
    updatedAt Date
*/


import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true } // createdAt and updatedAt is added here
)

commentSchema.plugin(mongooseAggregatePaginate);


export const Comment = mongoose.model("Comment", commentSchema);