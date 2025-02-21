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
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }, parent: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "parentType", // Dynamically references "Video" or "Tweet" and its _id is assigned
        },
        parentType: {
            type: String,
            required: true,
            enum: ["Video", "Tweet"], // Restricts parentType to these two models
        }
    },
    { timestamps: true } // createdAt and updatedAt is added here
)

commentSchema.plugin(mongooseAggregatePaginate);


export const Comment = mongoose.model("Comment", commentSchema);
// parameters = mongoose.model(modelName, schema, collectionName)