import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from '../models/user.models.js';
import { Video } from '../models/video.models.js';
import { Like } from '../models/like.models.js';

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Check if user is authenticated
  if (!userId) {
    throw new ApiError(401, "Please log in to like videos");
  }

  // Check if user's email is verified
  const user = await User.findById(userId).select('isEmailVerified');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email to like videos. Check your inbox for the verification code.");
  }

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Toggle like
  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: -1 } });
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    const like = await Like.create({ video: videoId, likedBy: userId });
    await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: 1 } });
    return res.status(201).json(new ApiResponse(201, like, "Like added"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  // Validate comment ID
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Valid Comment ID is required");
  }

  // Check if user is authenticated
  if (!userId) {
    throw new ApiError(401, "Please log in to like comments");
  }

  // Check if user exists and email is verified
  const user = await User.findById(userId).select('isEmailVerified');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email to like comments. Check your inbox for the verification code.");
  }

  // Toggle like
  const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });
  
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(new ApiResponse(200, existingLike, "Like removed"));
  } else {
    const like = await Like.create({
      comment: commentId,
      likedBy: userId
    });
    return res.status(201).json(new ApiResponse(201, like, "Like added"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  // Validate tweet ID
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Valid Tweet ID is required");
  }

  // Check if user is authenticated
  if (!userId) {
    throw new ApiError(401, "Please log in to like tweets");
  }

  // Check if user exists and email is verified
  const user = await User.findById(userId).select('isEmailVerified');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email to like tweets. Check your inbox for the verification code.");
  }

  // Toggle like
  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });
  
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(new ApiResponse(200, existingLike, "Like removed"));
  } else {
    const like = await Like.create({
      tweet: tweetId,
      likedBy: userId
    });
    return res.status(201).json(new ApiResponse(201, like, "Like added"));
  }
});

// Get all liked videos for the current user
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          video: { $exists: true }
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails"
        }
      },
      { $unwind: "$videoDetails" },
      {
        $lookup: {
          from: "users",
          localField: "videoDetails.owner",
          foreignField: "_id",
          as: "ownerDetails"
        }
      },
      { $unwind: "$ownerDetails" },
      {
        $project: {
          _id: "$videoDetails._id",
          title: "$videoDetails.title",
          description: "$videoDetails.description",
          duration: "$videoDetails.duration",
          views: "$videoDetails.views",
          thumbnail: "$videoDetails.thumbnail",
          videoFile: "$videoDetails.videoFile",
          likesCount: "$videoDetails.likesCount",
          createdAt: "$videoDetails.createdAt",
          owner: {
            _id: "$ownerDetails._id",
            username: "$ownerDetails.username",
            avatar: "$ownerDetails.avatar",
            isVerified: "$ownerDetails.isVerified"
          }
        }
      }
    ]);

    return res.status(200).json(new ApiResponse(200, {
      count: likedVideos.length,
      videos: likedVideos
    }, "Liked videos fetched successfully"));
  } catch (error) {
    console.error("Error fetching liked videos:", error);
    return res.status(500).json(new ApiError(500, "Failed to fetch liked videos"));
  }
});

// Debug endpoint to check all likes in database
const getAllLikes = asyncHandler(async (req, res) => {
  try {
    const allLikes = await Like.find({}).populate('likedBy', 'username').populate('video', 'title');
    console.log("All likes in database:", allLikes);
    return res.status(200).json(new ApiResponse(200, "All likes fetched", allLikes));
  } catch {
    console.error("Error fetching all likes:");
    return res.status(500).json(new ApiError(500, "Error fetching all likes"));
  }
});

// Check like status for any entity
const checkLikeStatus = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.query;
  const userId = req.user?._id;

  if (!entityType || !entityId) {
    return res.status(400).json(new ApiError(400, "Entity type and ID are required"));
  }

  try {
    // Get both like existence and count in a single query
    const [likeExists, likeCount] = await Promise.all([
      Like.exists({
        [entityType]: entityId,
        likedBy: userId
      }),
      Like.countDocuments({
        [entityType]: entityId
      })
    ]);

    return res.status(200).json(new ApiResponse(200, {
      isLiked: !!likeExists,
      likeCount
    }, "Like status checked"));
  } catch {
    return res.status(500).json(new ApiError(500, "Failed to check like status"));
  }
});

// Utility function to sync like counts (for data consistency)
const syncLikeCounts = asyncHandler(async (req, res) => {
  try {
    // Get all videos
    const videos = await Video.find({});
    let updatedCount = 0;

    for (const video of videos) {
      // Count actual likes for this video
      const actualLikeCount = await Like.countDocuments({ video: video._id });

      // Update if count doesn't match
      if (video.likesCount !== actualLikeCount) {
        await Video.findByIdAndUpdate(video._id, { likesCount: actualLikeCount });
        updatedCount++;
      }
    }

    return res.status(200).json(new ApiResponse(200, {
      message: `Synced like counts for ${updatedCount} videos`,
      updatedVideos: updatedCount
    }));
  } catch {
    return res.status(500).json(new ApiError(500, "Failed to sync like counts"));
  }
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getAllLikes,
  checkLikeStatus,
  syncLikeCounts
}