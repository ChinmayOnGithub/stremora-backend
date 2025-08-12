import { Video } from '../models/video.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { mongoose } from 'mongoose';
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
    isVideoMimetype
} from "../utils/cloudinary.js"
import cloudinary from '../utils/cloudinary.js';
import { Like } from '../models/like.models.js';
import History from '../models/history.models.js';


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

// const publishAVideo = asyncHandler(async (req, res) => {
//     const { title, description } = req.body
//     // Validate user input
//     if (!title?.trim()) {
//         return res.status(400).json(new ApiError(400, "Title is required"));
//     }
//     if (!description?.trim()) {
//         return res.status(400).json(new ApiError(400, "Description is required"));
//     }
//     // first validate the user
//     const user = await User.findById(req.user?._id);
//     if (!user) {
//         return res.status(404).json(new ApiError(404, "User not found!"));
//     }
//     // lets handle the video upload part
//     let videoLocalPath = req.files?.videoFile?.[0]?.path;
//     let thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
//     const videoFile = req.files?.videoFile?.[0];
//     if (!videoLocalPath) {
//         return res.status(404).json(new ApiError(404, "Video file is required"));
//     }
//     // Validate mimetype
//     if (!isVideoMimetype(videoFile?.mimetype)) {
//         return res.status(400).json(new ApiError(400, "Invalid video format"));
//     }
//     // Debug logs for Cloudinary config and file existence
//     const fs = await import('fs');
//     console.log("[Cloudinary] Config at video upload:", cloudinary.config());
//     console.log("[Cloudinary] Video file path:", videoLocalPath, "Exists:", fs.existsSync(videoLocalPath));
//     let videoCloudinary = null;
//     // Helper cleanup function
//     const cleanup = async () => {
//         if (videoCloudinary?.public_id) {
//             await deleteFromCloudinary(videoCloudinary.public_id);
//         }
//     };
//     try {
//         // This is the old, incorrect call that was causing the "unsigned upload" error.
//         // videoCloudinary = await uploadOnCloudinary(videoLocalPath, videoFile?.mimetype, { timeout: 60000 });

//         // This is the new, correct call. It only passes the file path,
//         // forcing a secure, signed upload.
//         videoCloudinary = await uploadOnCloudinary(videoLocalPath);

//         if (!videoCloudinary || !videoCloudinary.duration) {
//             await cleanup();
//             throw new ApiError(500, "Video upload failed or missing metadata");
//         }
//     } catch (error) {
//         console.log("Error uploading video!.", error);
//         await cleanup();
//         throw new ApiError(500, "Failed to upload video file");
//     }
//     // now that the video uploaded to the cloudinary 
//     // lets create a video with all the components and link and store it in the database
//     console.log("Video Cloudinary Response:", videoCloudinary);
//     const duration = videoCloudinary.duration || 0;
//     const minutes = Math.floor((duration % 3600) / 60);
//     const seconds = Math.floor(duration % 60);
//     const videoDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

//     // Thumbnail is optional
//     let thumbnail;
//     if (thumbnailLocalPath) {
//         try {
//             console.log("[Cloudinary] Thumbnail file path:", thumbnailLocalPath, "Exists:", fs.existsSync(thumbnailLocalPath));

//             // The old, incorrect call is commented out.
//             // thumbnail = await uploadOnCloudinary(thumbnailLocalPath, thumbnailFile?.mimetype);

//             // This is the new, correct call for the thumbnail.
//             thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

//         } catch (error) {
//             console.log("Error uploading thumbnail!", error);
//             await cleanup();
//             throw new ApiError(500, "Failed to upload thumbnail file");
//         }
//     } else {
//         // Auto-Generate a Thumbnail from the Video at 2 Seconds using Cloudinary URL transformation
//         try {
//             const thumbnailUrl = cloudinary.url(videoCloudinary.public_id, {
//                 resource_type: "video",
//                 transformation: [
//                     { width: 300, height: 200, crop: "fill" },
//                     { start_offset: "2" },
//                     { format: "jpg" }
//                 ]
//             });
//             thumbnail = { url: thumbnailUrl };
//         } catch (error) {
//             console.error("Thumbnail generation failed:", error);
//             thumbnail = { url: "" };
//         }
//     }

//     try {
//         const video = new Video({
//             videoFile: videoCloudinary.url,
//             thumbnail: thumbnail?.url || "",
//             title,
//             description,
//             duration: videoDuration || '0',
//             owner: user._id
//         });
//         const publishedVideo = await video.save();
//         console.log(video);
//         if (!publishedVideo) {
//             await cleanup();
//             throw new ApiError(500, "Something went wrong while publishing the video.");
//         }
//         return res
//             .status(201) // Using 201 Created is more appropriate for a successful creation
//             .json(new ApiResponse(201, publishedVideo, "Successfully published video"));
//     } catch (error) {
//         console.error("Error while saving video to database:", error);
//         // Ensure cleanup happens if the final database save fails
//         await cleanup();
//         throw new ApiError(500, "Error while publishing video");
//     }
// });

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];
    const videoLocalPath = videoFile?.path;
    const thumbnailLocalPath = thumbnailFile?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    // This is the correct way to call your new upload function.
    // It passes the mimetype to determine the correct folder for a secure, signed upload.
    const videoCloudinary = await uploadOnCloudinary(videoLocalPath, videoFile.mimetype);
    if (!videoCloudinary?.url) {
        throw new ApiError(500, "Failed to upload video file to Cloudinary");
    }

    let thumbnailUrl = "";
    if (thumbnailLocalPath) {
        // This is also the corrected call for the thumbnail.
        const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath, thumbnailFile.mimetype);
        if (thumbnailCloudinary?.url) {
            thumbnailUrl = thumbnailCloudinary.url;
        } else {
            console.error("Failed to upload provided thumbnail, will attempt to auto-generate.");
        }
    }

    // Auto-generate a thumbnail if one wasn't provided or failed to upload
    if (!thumbnailUrl) {
        try {
            thumbnailUrl = cloudinary.url(videoCloudinary.public_id, {
                resource_type: "video",
                transformation: [
                    { width: 400, height: 225, crop: "fill" },
                    { start_offset: "2" },
                    { format: "jpg" }
                ]
            });
        } catch (error) {
            console.error("Automatic thumbnail generation failed:", error);
            thumbnailUrl = "";
        }
    }

    const duration = videoCloudinary.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const videoDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    const video = await Video.create({
        videoFile: videoCloudinary.url,
        thumbnail: thumbnailUrl,
        title,
        description,
        duration: videoDuration,
        owner: user._id
    });

    if (!video) {
        // If saving fails, we should try to clean up the uploaded video from Cloudinary
        await deleteFromCloudinary(videoCloudinary.public_id);
        throw new ApiError(500, "Something went wrong while saving the video to the database.");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});





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

// const updateVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: update video details like title, description, thumbnail
//     if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
//         console.log("Invalid videoId");
//         return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
//     }

//     const { title, description } = req.body;

//     // optionally update whatever is provided
//     const updateFields = {};
//     if (title) updateFields.title = title;
//     if (description) updateFields.description = description;



//     // now update the thumbnail (optionally)
//     const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

//     let thumbnail;
//     if (thumbnailLocalPath) {
//         try {
//             // Find the existing video to get the current thumbnail public_id
//             const existingVideo = await Video.findById(videoId);
//             if (existingVideo && existingVideo.thumbnail) {
//                 // Delete the old thumbnail from Cloudinary
//                 await deleteFromCloudinary(existingVideo.thumbnail);
//             }

//             // Upload the new thumbnail to Cloudinary
//             thumbnail = await uploadOnCloudinary(thumbnailLocalPath, req.files?.thumbnail?.[0]?.mimetype);
//         } catch {
//             return res.status(500).json(new ApiError(500, "Error while uploading the thumbnail!"));
//         }
//     }

//     if (thumbnail) updateFields.thumbnail = thumbnail.url;

//     // update all the fields
//     try {
//         const video = await Video.findByIdAndUpdate(
//             videoId,
//             {
//                 $set: updateFields
//             },
//             {
//                 new: true
//             }
//         );

//         return res
//             .status(200)
//             .json(new ApiResponse(200, "Updated video details successfully", video))
//     } catch {
//         return res.status(500).json(new ApiError(500, "Error while updating video"));
//     }


// });
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }

    const { title, description } = req.body;
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;

    const thumbnailFile = req.files?.thumbnail?.[0];
    const thumbnailLocalPath = thumbnailFile?.path;

    if (thumbnailLocalPath) {
        try {
            const existingVideo = await Video.findById(videoId);
            if (existingVideo && existingVideo.thumbnail) {
                await deleteFromCloudinary(existingVideo.thumbnail);
            }
            // This is the correct way to call your new upload function
            const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, thumbnailFile.mimetype);
            if (thumbnail?.url) {
                updateFields.thumbnail = thumbnail.url;
            }
        } catch (err) {
            throw new ApiError(500, "Error while updating the thumbnail!");
        }
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Updated video details successfully"))
});


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
    } catch {
        return res.status(500).json(new ApiError(500, "Error while deleting video"));
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


// const viewVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params;
//     const { position = 0, duration = 0 } = req.body;
//     if (!req.user || !req.user._id) {
//         // Only log critical auth errors
//         console.warn("VIEW VIDEO: Unauthenticated request attempt");
//         throw new ApiError(401, "Unauthorized access");
//     }
//     if (!mongoose.Types.ObjectId.isValid(videoId)) {
//         // Only log critical ID errors
//         console.error(`VIEW VIDEO: Invalid video ID format: ${videoId}`);
//         throw new ApiError(400, "Invalid video ID format");
//     }
//     try {
//         const video = await Video.findById(videoId);
//         if (!video) {
//             // Only log if video not found
//             console.warn(`VIEW VIDEO: Video not found: ${videoId}`);
//             throw new ApiError(404, "Video not found");
//         }
//         video.views += 1;
//         await video.save();
//         // Log only successful view count increment
//         // console.info(`VIEW VIDEO: Incremented views for video ${videoId}`);
//         try {
//             const completed = duration > 0 && (position / duration) > 0.8;
//             await History.findOneAndUpdate(
//                 { video: videoId, user: req.user._id },
//                 {
//                     $set: {
//                         watched: true,
//                         lastWatched: new Date(),
//                         lastPosition: position,
//                         watchDuration: duration,
//                         completed,
//                         watchedAt: new Date(),
//                         updatedAt: new Date()
//                     },
//                     $inc: { viewCount: 1 }
//                 },
//                 { upsert: true, new: true }
//             );
//             // Only log on critical error
//         } catch (historyError) {
//             console.error("HISTORY UPDATE ERROR:", historyError);
//         }
//         return res.status(200).json(new ApiResponse(200, "View counted successfully"));
//     } catch (error) {
//         // Only log critical errors
//         console.error("VIEW VIDEO ERROR:", {
//             videoId,
//             user: req.user?._id,
//             error: error.message,
//             stack: error.stack
//         });
//         const statusCode = error.statusCode || 500;
//         const message = error.message || "Internal server error";
//         throw new ApiError(statusCode, message);
//     }
// });

const viewVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { position = 0, duration = 0 } = req.body;

    console.log("VIEW VIDEO: Request received");
    console.log("VIDEO ID =", videoId);
    console.log("BODY =", req.body);
    console.log("USER =", req.user);

    if (!req.user || !req.user._id) {
        console.warn("VIEW VIDEO: Unauthenticated request attempt");
        throw new ApiError(401, "Unauthorized access");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        console.error(`VIEW VIDEO: Invalid video ID format: ${videoId}`);
        throw new ApiError(400, "Invalid video ID format");
    }

    try {
        console.log("VIEW VIDEO: Fetching video from DB...");
        const video = await Video.findById(videoId);
        if (!video) {
            console.warn(`VIEW VIDEO: Video not found: ${videoId}`);
            throw new ApiError(404, "Video not found");
        }

        console.log(`VIEW VIDEO: Found video (${video.title}), incrementing views...`);
        video.views += 1;
        await video.save();
        console.log("VIEW VIDEO: Video views saved.");

        try {
            const completed = duration > 0 && (position / duration) > 0.8;
            console.log("VIEW VIDEO: Updating history entry...");
            console.log("HISTORY UPSERT DATA =", {
                user: req.user._id,
                video: videoId,
                watched: true,
                completed,
                watchDuration: duration,
                lastPosition: position,
            });

            const updatedHistory = await History.findOneAndUpdate(
                { video: videoId, user: req.user._id },
                {
                    $set: {
                        watched: true,
                        lastWatched: new Date(),
                        lastPosition: position,
                        watchDuration: duration,
                        completed,
                        watchedAt: new Date(),
                        updatedAt: new Date()
                    },
                    $inc: { viewCount: 1 }
                },
                { upsert: true, new: true }
            );

            console.log("VIEW VIDEO: History entry upsert result =", updatedHistory);

        } catch (historyError) {
            console.error("HISTORY UPDATE ERROR:", historyError);
        }

        return res.status(200).json(new ApiResponse(200, "View counted successfully"));
    } catch (error) {
        console.error("VIEW VIDEO ERROR:", {
            videoId,
            user: req.user?._id,
            error: error.message,
            stack: error.stack
        });
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal server error";
        throw new ApiError(statusCode, message);
    }
});


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

// Get all videos uploaded by the currently authenticated user ("My Videos" dashboard)
const getMyVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortType = 'desc', query } = req.query;

    if (!userId) {
        return res.status(401).json(new ApiError(401, "User not authenticated!"));
    }

    const filter = { owner: userId };
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    try {
        const totalVideosCount = await Video.countDocuments(filter);
        let videos = await Video
            .find(filter)
            .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('owner', 'username email avatar');

        // Get like counts for all videos
        const likeCounts = await Like.aggregate([
            { $match: { video: { $in: videos.map(v => v._id) } } },
            { $group: { _id: "$video", count: { $sum: 1 } } }
        ]);
        const likeCountMap = {};
        likeCounts.forEach(item => {
            likeCountMap[item._id.toString()] = item.count;
        });

        // Get comment counts for all videos
        // (Assuming you have a Comment model and video field)
        let commentCountMap = {};
        try {
            const Comment = (await import('../models/comment.models.js')).Comment;
            const commentCounts = await Comment.aggregate([
                { $match: { parent: { $in: videos.map(v => v._id) }, parentType: "Video" } },
                { $group: { _id: "$parent", count: { $sum: 1 } } }
            ]);
            commentCounts.forEach(item => {
                commentCountMap[item._id.toString()] = item.count;
            });
        } catch {
            // If comment model not found, skip
        }

        videos = videos.map(video => {
            const videoObj = video.toObject();
            videoObj.likeCount = likeCountMap[video._id.toString()] || 0;
            videoObj.commentCount = commentCountMap[video._id.toString()] || 0;
            return videoObj;
        });

        return res.status(200).json(new ApiResponse(200, "My videos fetched successfully", {
            totalVideosCount,
            videos,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalVideosCount / limit),
                totalItems: totalVideosCount,
                itemsPerPage: parseInt(limit)
            }
        }));
    } catch (err) {
        console.error("Error fetching my videos:", err);
        return res.status(500).json(new ApiError(500, "Something went wrong while fetching your videos", err));
    }
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    viewVideo as incrementView,
    getChannelPopularVideos,
    getChannelLatestVideos,
    getChannelOldestVideos,
    getMyVideos // <-- export new controller
}
