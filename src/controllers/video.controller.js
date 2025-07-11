import { Video } from '../models/video.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { mongoose } from 'mongoose';
import {
    uploadOnCloudinary,
    deleteFromCloudinary
} from "../utils/cloudinary.js"
import cloudinary from '../utils/cloudinary.js';
import { Like } from '../models/like.models.js';


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filter = {};
    try {
        if (userId) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json(new ApiError(404, "User not found!"));
            }
            filter.owner = userId; // This userId is the owner of the videos we want to search
        }

        if (query) {
            filter.$or = [
                {
                    title:
                    {
                        $regex: query,
                        $options: 'i'
                    }
                },
                {
                    description:
                    {
                        $regex: query,
                        $options: 'i'
                    }

                }
            ];
        }


        // Count total videos that match the filter
        const totalVideosCount = await Video.countDocuments(filter);

        // Get videos with pagination
        let videos = await Video
            .find(filter)
            .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit) // skip prev pages
            .limit(limit) // limits number of documents in one page
            .populate('owner', 'username email avatar'); // Fetch owner's name, email, and avatar

        // If user is authenticated, add like information
        if (req.user?._id) {
            console.log("User authenticated, checking likes for user:", req.user._id);
            console.log("Videos to check:", videos.map(v => v._id));

            // Get like counts for all videos
            const likeCounts = await Like.aggregate([
                {
                    $match: {
                        video: { $in: videos.map(v => v._id) }
                    }
                },
                {
                    $group: {
                        _id: "$video",
                        count: { $sum: 1 }
                    }
                }
            ]);

            console.log("Like counts found:", likeCounts);

            // Get user's likes for these videos
            const userLikes = await Like.find({
                video: { $in: videos.map(v => v._id) },
                likedBy: req.user._id
            }).select('video');

            console.log("User likes found:", userLikes);

            // Create lookup maps
            const likeCountMap = {};
            likeCounts.forEach(item => {
                likeCountMap[item._id.toString()] = item.count;
            });

            const userLikesSet = new Set(userLikes.map(like => like.video.toString()));

            console.log("Like count map:", likeCountMap);
            console.log("User likes set:", Array.from(userLikesSet));

            // Add like information to videos
            videos = videos.map(video => {
                const videoObj = video.toObject();
                videoObj.likeCount = likeCountMap[video._id.toString()] || 0;
                videoObj.isLiked = userLikesSet.has(video._id.toString());
                console.log(`Video ${video._id}: likeCount=${videoObj.likeCount}, isLiked=${videoObj.isLiked}`);
                return videoObj;
            });
        } else {
            console.log("No authenticated user, skipping like information");
            // For non-authenticated users, just add like counts
            const likeCounts = await Like.aggregate([
                {
                    $match: {
                        video: { $in: videos.map(v => v._id) }
                    }
                },
                {
                    $group: {
                        _id: "$video",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const likeCountMap = {};
            likeCounts.forEach(item => {
                likeCountMap[item._id.toString()] = item.count;
            });

            videos = videos.map(video => {
                const videoObj = video.toObject();
                videoObj.likeCount = likeCountMap[video._id.toString()] || 0;
                videoObj.isLiked = false;
                return videoObj;
            });
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Videos fetched successfully",
                {
                    totalVideosCount,
                    videos
                }));
    } catch (err) {
        console.log("Something went wrong", err);
        return res
            .status(500)
            .json(new ApiError(500, "Something went wrong while fetching videos", err));
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // // TODO: get video, upload to cloudinary, create video
    // Validate user input
    if (!title?.trim()) {
        return res.status(400).json(new ApiError(400, "Title is required"));
    }
    if (!description?.trim()) {
        return res.status(400).json(new ApiError(400, "Description is required"));
    }
    // first validate the user
    const user = await User.findById(req.user?._id);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found!"));
    }
    // lets handle the video upload part
    let videoLocalPath = req.files?.videoFile?.[0]?.path;
    let thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if (!videoLocalPath) {
        return res.status(404).json(new ApiError(404, "Video file is required"));
    }
    // Debug logs for Cloudinary config and file existence
    const fs = await import('fs');
    console.log("[Cloudinary] Config at video upload:", cloudinary.config());
    console.log("[Cloudinary] Video file path:", videoLocalPath, "Exists:", fs.existsSync(videoLocalPath));
    let videoCloudinary = null;
    try {
        videoCloudinary = await uploadOnCloudinary(videoLocalPath)
    } catch (error) {
        console.log("Error uploading video!.", error);
        throw new ApiError(500, "Failed to upload video file");
    }
    // now that the video uploaded to the cloudanary 
    // lets create a video with all the components and link and store it in the datebase
    console.log("Video Cloudinary Response:", videoCloudinary);
    const minutes = Math.floor((videoCloudinary.duration % 3600) / 60);
    const seconds = Math.floor(videoCloudinary.duration % 60);
    const videoDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`; // Ensures `0:5` → `0:05`


    // Thumbnail is optional
    // Handle Thumbnail (If User Uploads One)
    // implecit creation
    // let thumbnail;
    // if (thumbnailLocalPath) {
    //     try {
    //         thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    //     } catch (error) {
    //         console.log("Error uploading thumbnail!", error);
    //         throw new ApiError(500, "Failed to upload thumbnail file");
    //     }
    // } else {
    //     // Auto-Generate a Thumbnail from the Video at 2 Seconds
    //     thumbnail = {
    //         url: videoCloudinary.url.replace("/upload/", "/upload/so_2,w_300,h_200,c_fill/") + ".jpg"
    //     };
    // }

    let thumbnail;
    if (thumbnailLocalPath) {
        try {
            console.log("[Cloudinary] Thumbnail file path:", thumbnailLocalPath, "Exists:", fs.existsSync(thumbnailLocalPath));
            thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        } catch (error) {
            console.log("Error uploading thumbnail!", error);
            throw new ApiError(500, "Failed to upload thumbnail file");
        }
    } else {
        // 🌟 Auto-Generate a Thumbnail from the Video at 2 Seconds Using Cloudinary API 🌟
        try {
            console.log("[Cloudinary] Config at thumbnail generation:", cloudinary.config());
            const thumbnailResponse = await cloudinary.uploader.explicit(videoCloudinary.public_id, {
                resource_type: "video",
                type: "upload",
                eager: [{ format: "jpg", transformation: [{ width: 300, height: 200, crop: "fill", start_offset: "2" }] }],
            });

            thumbnail = {
                url: thumbnailResponse.eager[0].secure_url, // Extract generated thumbnail URL
            };
        } catch (error) {
            console.log("Error generating video thumbnail!", error);
            thumbnail = { url: "" }; // Fallback to empty if thumbnail generation fails
        }
    }

    try {

        const video = new Video({
            videoFile: videoCloudinary.url, // need to mention url becuase the videoCloudinary is actually an Object
            thumbnail: thumbnail?.url || "",
            title,
            description,
            duration: videoDuration || '0',
            owner: user._id
        });

        const publishedVideo = await video.save();
        console.log(video);

        if (!publishedVideo) {
            throw new ApiError(500, "Something went wrong while publishing the video.");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Successfully published video", publishedVideo))

    } catch (error) {
        console.log("Video creation failed.", error);
        if (videoCloudinary) {
            await deleteFromCloudinary(videoCloudinary.public_id)
        }
        if (thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id)
        }
        throw new ApiError(500, "Something went wrong while publishing the video and files were deleted");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // params are taken from the :videoId from url itself
    // Validate videoId
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }
    // Find video by id
    try {
        const video = await Video.findById(videoId)
            .populate('owner', 'username email avatar'); // Fetch owner's name, email, and avatar

        if (!video) {
            console.log("Video not found");
            return res.status(404).json(new ApiError(404, "Video not found"));
        }

        // Convert to object for modification
        let videoObj = video.toObject();

        // Get like count
        const likeCount = await Like.countDocuments({ video: videoId });
        videoObj.likeCount = likeCount;

        // Check if user has liked this video
        if (req.user?._id) {
            const userLike = await Like.findOne({
                video: videoId,
                likedBy: req.user._id
            });
            videoObj.isLiked = !!userLike;
            console.log(`Video ${videoId}: isLiked=${videoObj.isLiked}, likeCount=${videoObj.likeCount}`);
        } else {
            videoObj.isLiked = false;
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Fetched video by ID successfully", videoObj));
    } catch (error) {
        console.log("Error while finding the video", error);
        return res
            .status(500)
            .json(new ApiError(500, "Error while finding the video", error));
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }

    const { title, description } = req.body;

    // optionally update whatever is provided
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;



    // now update the thumbnail (optionally)
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    let thumbnail;
    if (thumbnailLocalPath) {
        try {
            // Find the existing video to get the current thumbnail public_id
            const existingVideo = await Video.findById(videoId);
            if (existingVideo && existingVideo.thumbnail) {
                // Delete the old thumbnail from Cloudinary
                await deleteFromCloudinary(existingVideo.thumbnail);
            }

            // Upload the new thumbnail to Cloudinary
            thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        } catch (error) {
            return res.status(500).json(new ApiError(500, "Error while uploading the thumbnail!"));
        }
    }

    if (thumbnail) updateFields.thumbnail = thumbnail.url;

    // update all the fields
    try {
        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: updateFields
            },
            {
                new: true
            }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, "Updated video details successfully", video))
    } catch (error) {
        console.log("couldnt update the details");

        return res.status(500).json(new ApiError(404, "Error while updating the video details"))
    }


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }

    try {
        // Find the video to get the Cloudinary public IDs
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json(new ApiError(404, "Video not found"));
        }

        // Delete the video and thumbnail from Cloudinary
        if (video.videoFile) {
            await deleteFromCloudinary(video.videoFile);
        }
        if (video.thumbnail) {
            await deleteFromCloudinary(video.thumbnail);
        }

        // Delete the video from the database
        await Video.findByIdAndDelete(videoId);

        return res
            .status(200)
            .json(new ApiResponse(200, "Deleted video successfully", video));
    } catch (error) {
        return res
            .status(500)
            .json(new ApiError(500, "Something went wrong while deleting the video"));
    }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            console.log("Video not found");
            return res.status(404).json(new ApiError(404, "Video not found"));
        }

        video.isPublished = !video.isPublished;
        await video.save();

        return res
            .status(200)
            .json(new ApiResponse(200, "Video publish status updated successfully", video));
    } catch (error) {
        console.log("Error while updating publish status", error);
        return res
            .status(500)
            .json(new ApiError(500, "Something went wrong while setting publish status", error));
    }
});


const incrementView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }

    try {
        const video = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { views: 1 } }, // Atomic increment
            { new: true } // Return updated document
        );

        if (!video) {
            console.log("Video not found");
            return res.status(404).json(new ApiError(404, "Video not found"));
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, "View count incremented successfully", { views: video.views })
            );
    } catch (error) {
        console.error("Error incrementing view count:", error);
        return res.status(500).json(
            new ApiError(500, "Failed to increment view count", error)
        );
    }
})

// Trending videos (most viewed)
export const getTrendingVideos = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    try {
        const videos = await Video.aggregate([
            { $sort: { views: -1, createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [{ $project: { username: 1, avatar: 1 } }]
                }
            },
            { $unwind: "$owner" }
        ]);

        if (!videos.length) {
            return res.status(200).json(
                new ApiResponse(200, [], "No trending videos found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, videos, "Trending videos fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching trending videos:", error);
        return res.status(500).json(
            new ApiError(500, "Failed to fetch trending videos", error)
        );
    }
});

// Recommended videos (custom logic example)
export const getRecommendedVideos = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const videos = await Video.aggregate([
        {
            $addFields: {
                // Simplified scoring without likesCount
                popularityScore: "$views",
                recencyScore: {
                    $divide: [
                        { $subtract: [new Date(), "$createdAt"] },
                        1000 * 60 * 60 * 24
                    ]
                }
            }
        },
        {
            $addFields: {
                recommendationScore: {
                    $subtract: [
                        "$popularityScore",
                        { $multiply: ["$recencyScore", 0.1] } // Favor newer videos slightly
                    ]
                }
            }
        },
        { $sort: { recommendationScore: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$owner" }
    ]);

    const total = await Video.countDocuments();

    res.status(200).json(new ApiResponse(200, {
        videos,
        total,
        page,
        pages: Math.ceil(total / limit)
    }, "Recommended videos fetched"));
});

// Modular function for channel video queries
const getChannelVideosBySort = (sortField, sortOrder) => asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    if (!channelId) {
        return res.status(400).json(new ApiError(400, "Channel ID is required"));
    }

    const filter = { owner: channelId, isPublished: true };
    const total = await Video.countDocuments(filter);
    let videos = await Video.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username avatar');

    // Add like information
    if (req.user?._id) {
        // Get like counts for all videos
        const likeCounts = await Like.aggregate([
            {
                $match: {
                    video: { $in: videos.map(v => v._id) }
                }
            },
            {
                $group: {
                    _id: "$video",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get user's likes for these videos
        const userLikes = await Like.find({
            video: { $in: videos.map(v => v._id) },
            likedBy: req.user._id
        }).select('video');

        // Create lookup maps
        const likeCountMap = {};
        likeCounts.forEach(item => {
            likeCountMap[item._id.toString()] = item.count;
        });

        const userLikesSet = new Set(userLikes.map(like => like.video.toString()));

        // Add like information to videos
        videos = videos.map(video => {
            const videoObj = video.toObject();
            videoObj.likeCount = likeCountMap[video._id.toString()] || 0;
            videoObj.isLiked = userLikesSet.has(video._id.toString());
            return videoObj;
        });
    } else {
        // For non-authenticated users, just add like counts
        const likeCounts = await Like.aggregate([
            {
                $match: {
                    video: { $in: videos.map(v => v._id) }
                }
            },
            {
                $group: {
                    _id: "$video",
                    count: { $sum: 1 }
                }
            }
        ]);

        const likeCountMap = {};
        likeCounts.forEach(item => {
            likeCountMap[item._id.toString()] = item.count;
        });

        videos = videos.map(video => {
            const videoObj = video.toObject();
            videoObj.likeCount = likeCountMap[video._id.toString()] || 0;
            videoObj.isLiked = false;
            return videoObj;
        });
    }

    return res.status(200).json(new ApiResponse(200, {
        videos,
        total,
        page,
        pages: Math.ceil(total / limit)
    }, `Channel videos sorted by ${sortField} (${sortOrder > 0 ? 'asc' : 'desc'})`));
});

const getChannelPopularVideos = getChannelVideosBySort('views', -1); // Most popular
const getChannelLatestVideos = getChannelVideosBySort('createdAt', -1); // Latest
const getChannelOldestVideos = getChannelVideosBySort('createdAt', 1); // Oldest

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    incrementView,
    getChannelPopularVideos,
    getChannelLatestVideos,
    getChannelOldestVideos
}
