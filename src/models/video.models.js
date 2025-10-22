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
        url: {
            type: String,
            required: true
        }, // The full URL
        public_id: {
            type: String,
            required: true
        }, // The public_id from Cloudinary or S3
        storage_provider: {
            type: String,
            enum: ["cloudinary", "s3"],
            default: "cloudinary"
        }, // Track which storage provider is used
    },
    thumbnail: {
        url: {
            type: String,
            required: false, // FIXED: Make thumbnail URL optional since auto-generation might fail
            default: "" // Provide a default empty string
        },
        public_id: {
            type: String,
            required: false
        },
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