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
            required: false,
            default: ""
        },
        public_id: {
            type: String,
            required: false
        },
        storage_provider: {
            type: String,
            enum: ["cloudinary", "s3"],
            default: "cloudinary"
        }
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
        default: ""
    },
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: function(tags) {
                return tags.length <= 10; // Max 10 tags
            },
            message: 'Maximum 10 tags allowed'
        }
    },
    category: {
        type: String,
        enum: ['Education', 'Entertainment', 'Gaming', 'Music', 'News', 'Sports', 'Technology', 'Other'],
        default: 'Other'
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

// Indexes for performance
videoSchema.index({ views: -1, createdAt: -1 });
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ isPublished: 1, createdAt: -1 });

// TEXT INDEX for fast full-text search
videoSchema.index({ 
    title: 'text', 
    description: 'text' 
}, {
    weights: {
        title: 10,        // Title is 10x more important than description
        description: 5
    },
    name: 'video_text_search'
});
videoSchema.index({ recommendationScore: -1 });

export const Video = mongoose.model("Video", videoSchema);