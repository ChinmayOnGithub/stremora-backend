import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import History from "../models/history.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Like } from "../models/like.models.js";
import mongoose from "mongoose";

// Get user's watch history (simplified version)
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { page = 1, limit = 20, sortBy = 'lastWatched', sortOrder = 'desc' } = req.query;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  try {
    const skip = (page - 1) * limit;

    // Fetch history with video and owner populated
    const history = await History.find({ user: userId })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'video',
        select: 'title thumbnail duration views owner',
        populate: {
          path: 'owner',
          select: 'username avatar'
        }
      })
      .lean();

    // Filter out entries where video might be deleted
    const validHistory = history.filter(entry => entry.video !== null);

    const totalCount = await History.countDocuments({ user: userId });

    return res.status(200).json(new ApiResponse(200, "History fetched successfully", {
      history: validHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    }));
  } catch (error) {
    console.error("Error fetching history:", error);
    throw new ApiError(500, "Failed to fetch history");
  }
});

// Remove video from history
const removeFromHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid video ID is required");
  }

  try {
    const deletedEntry = await History.findOneAndDelete({ user: userId, video: videoId });

    if (!deletedEntry) {
      throw new ApiError(404, "History entry not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Video removed from history", deletedEntry));
  } catch (error) {
    console.error("Error removing from history:", error);
    throw new ApiError(500, "Failed to remove video from history");
  }
});

// Clear entire history
const clearHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  try {
    const result = await History.deleteMany({ user: userId });

    return res
      .status(200)
      .json(new ApiResponse(200, "History cleared successfully", {
        deletedCount: result.deletedCount
      }));
  } catch (error) {
    console.error("Error clearing history:", error);
    throw new ApiError(500, "Failed to clear history");
  }
});

// Get history statistics
const getHistoryStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  try {
    const stats = await History.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalWatchTime: { $sum: "$watchDuration" },
          completedVideos: {
            $sum: { $cond: ["$completed", 1, 0] }
          },
          averageWatchTime: { $avg: "$watchDuration" }
        }
      }
    ]);

    const recentActivity = await History.find({ user: userId })
      .sort({ watchedAt: -1 })
      .limit(5)
      .populate('video', 'title thumbnail duration');

    const statsData = stats[0] || {
      totalVideos: 0,
      totalWatchTime: 0,
      completedVideos: 0,
      averageWatchTime: 0
    };

    return res
      .status(200)
      .json(new ApiResponse(200, "History statistics fetched", {
        ...statsData,
        recentActivity
      }));
  } catch (error) {
    console.error("Error fetching history stats:", error);
    throw new ApiError(500, "Failed to fetch history statistics");
  }
});

export {
  getHistory,
  removeFromHistory,
  clearHistory,
  getHistoryStats
}; 