/*
    id string pk
    owner ObjectId users
    videoFile string
    thumbnail string
    title string
    description string
    duration number
    views number
    isPublished boolean
    createdAt Date
    updatedAt Date
*/

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String, // cloudinary URL
        required: true,

    },
    thumbnail: {
        type: String, // cloudinary URL
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    likesCount: { type: Number, default: 0 },
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate)

videoSchema.index({ views: -1, createdAt: -1 });
videoSchema.index({ recommendationScore: -1 });

export const Video = mongoose.model("Video", videoSchema);