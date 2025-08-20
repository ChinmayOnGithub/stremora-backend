// controllers/admin.controller.js
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.models.js";
import { Comment } from "../models/comment.models.js";
import History from "../models/history.models.js";
import { Like } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Tweet } from "../models/tweet.models.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js"; // 1. IMPORT THE DELETE HELPER

// List all users (excluding password and refreshToken)
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res.json(users);
};

// Delete a user by ID
export const deleteUserById = async (req, res) => {
  const { id } = req.params;
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "User not found");
  res.json({ message: "User deleted" });
};

// List all videos
export const getAllVideos = async (req, res) => {
  const videos = await Video.find().populate("owner", "username avatar");
  res.json(videos);
};

// Delete a video by ID
// --- THIS IS THE FULLY CORRECTED FUNCTION ---
export const deleteVideoById = async (req, res) => {
  const { id } = req.params;

  // Step 1: Find the video document to get the asset public_ids
  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Step 2: Delete assets from Cloudinary using their stored public_ids and correct resource types
  const assetDeletionPromises = [];

  // Delete the video file
  if (video.videoFile?.public_id) {
    assetDeletionPromises.push(deleteFromCloudinary(video.videoFile.public_id, "video"));
  }

  // Delete the thumbnail image
  if (video.thumbnail?.public_id) {
    assetDeletionPromises.push(deleteFromCloudinary(video.thumbnail.public_id, "image"));
  }

  await Promise.all(assetDeletionPromises);

  // Step 3: Delete the video from MongoDB and its associated data
  await Video.findByIdAndDelete(id);
  await Comment.deleteMany({ video: id });
  await Like.deleteMany({ video: id });

  res.json({ message: "Video and all associated assets deleted successfully" });
};

// --- Playlists ---
export const getAllPlaylists = async (req, res) => {
  const playlists = await Playlist.find();
  res.json(playlists);
};
export const deletePlaylistById = async (req, res) => {
  const { id } = req.params;
  const deleted = await Playlist.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Playlist not found");
  res.json({ message: "Playlist deleted" });
};

// --- Comments ---
export const getAllComments = async (req, res) => {
  const comments = await Comment.find();
  res.json(comments);
};
export const deleteCommentById = async (req, res) => {
  const { id } = req.params;
  const deleted = await Comment.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Comment not found");
  res.json({ message: "Comment deleted" });
};

// --- History ---
export const getAllHistory = async (req, res) => {
  const history = await History.find();
  res.json(history);
};
export const deleteHistoryById = async (req, res) => {
  const { id } = req.params;
  const deleted = await History.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "History entry not found");
  res.json({ message: "History entry deleted" });
};

// --- Likes ---
export const getAllLikes = async (req, res) => {
  const likes = await Like.find();
  res.json(likes);
};
export const deleteLikeById = async (req, res) => {
  const { id } = req.params;
  const deleted = await Like.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Like not found");
  res.json({ message: "Like deleted" });
};

// --- Subscriptions ---
export const getAllSubscriptions = async (req, res) => {
  const subscriptions = await Subscription.find();
  res.json(subscriptions);
};
export const deleteSubscriptionById = async (req, res) => {
  const { id } = req.params;
  const deleted = await Subscription.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Subscription not found");
  res.json({ message: "Subscription deleted" });
};

// --- Tweets ---
export const getAllTweets = async (req, res) => {
  const tweets = await Tweet.find();
  res.json(tweets);
};
export const deleteTweetById = async (req, res) => {
  const { id } = req.params;
  const deleted = await Tweet.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Tweet not found");
  res.json({ message: "Tweet deleted" });
};
