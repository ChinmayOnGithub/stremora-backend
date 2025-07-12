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

  if (!isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid video ID"));
  }

  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: -1 } });
    return res.status(200).json(new ApiResponse(200, "Like removed"));
  } else {
    const like = await Like.create({ video: videoId, likedBy: userId });
    await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: 1 } });
    return res.status(201).json(new ApiResponse(201, "Like added", like));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  //TODO: toggle like on comment

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    console.log("Invalid commentId");
    return res.status(400).json(new ApiError(400, "Valid Comment ID is required"));
  }

  // recheck user
  const user = await User.findById(req.user?._id)
  if (!user) {
    return res.status(401).json(new ApiError(401, "User not found, Please sign in to like this comment"))
  }
  // check if video is already liked
  const existingLike = await Like.findOne({ comment: commentId, likedBy: user._id })
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id })
    return res.status(200).json(new ApiResponse(200, "Like removed", existingLike))
  } else {
    try {
      const like = await Like.create({
        comment: commentId,
        likedBy: user._id
      })
      return res.status(201).json(new ApiResponse(201, "Like added", like))
    } catch (error) {
      return res.status(500).json(new ApiError(500, "An error occurred while adding the like", error))
    }
  }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  //TODO: toggle like on tweet

  if (!tweetId || !isValidObjectId(tweetId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Tweet Id is not valid"))
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    return res.status(400).json(new ApiError(400, "User not found"));
  }

  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id })
    return res.status(200).json(new ApiResponse(200, "Like removed", existingLike))
  } else {
    try {
      const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
      })
      return res.status(201).json(new ApiResponse(201, "Like added", like))
    } catch (error) {
      return res.status(400).json(new ApiError(400, "Something went wrong while toggling like for the tweet"))
    }
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
          likesCount: "$videoDetails.likesCount",
          createdAt: "$videoDetails.createdAt",
          owner: {
            _id: "$ownerDetails._id",
            username: "$ownerDetails.username",
            avatar: "$ownerDetails.avatar"
          }
        }
      }
    ]);

    return res.status(200).json(new ApiResponse(200, {
      count: likedVideos.length,
      videos: likedVideos
    }, "Liked videos fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch liked videos"));
  }
});

// Debug endpoint to check all likes in database
const getAllLikes = asyncHandler(async (req, res) => {
  try {
    const allLikes = await Like.find({}).populate('likedBy', 'username').populate('video', 'title');
    console.log("All likes in database:", allLikes);
    return res.status(200).json(new ApiResponse(200, "All likes fetched", allLikes));
  } catch (error) {
    console.error("Error fetching all likes:", error);
    return res.status(500).json(new ApiError(500, "Error fetching all likes", error));
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
  } catch (error) {
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
  } catch (error) {
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