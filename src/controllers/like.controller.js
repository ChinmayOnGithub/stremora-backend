import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from '../models/user.models.js';
import { Video } from '../models/video.models.js';
import { Like } from '../models/like.models.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    console.log("Invalid videoId");
    return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
  }

  const user = await User.findById(req.user?._id)
  if (!user) {
    return res.status(401).json(new ApiError(401, "User not found, Please sign in to like this video"))
  }

  const video = await Video.findById(videoId)
  if (!video) {
    return res.status(404).json(new ApiError(404, "Video not found"))
  }
  // check if video is already liked
  const existingLike = await Like.findOne({ video: videoId, likedBy: user._id })
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id })
    return res.status(200).json(new ApiResponse(200, "Like removed", existingLike))
  } else {
    try {
      const like = await Like.create({
        video: videoId,
        likedBy: user._id
      })
      return res.status(201).json(new ApiResponse(201, "Like added", like))
    } catch (error) {
      return res.status(500).json(new ApiError(500, "An error occurred while adding the like", error))
    }
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

  const existingLike = await Like.findOne({ tweet: tweetId })
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

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  // i need to fetch all the videos liked by a single user
  // group by single user

  const user = await User.findById(req.user?._id)
  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found"))
  }
  try {
    const videos = await Like.aggregate([
      {
        $match: {
          likedBy: req.user._id
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoInfo"
        }
      },
      {
        $unwind: "$videoInfo" // used to flatten the array
      },
      {
        $project: { // select what you want to display in the final array output
          _id: 0,
          "videoInfo._id": 1,
          "videoInfo.title": 1,
          "videoInfo.description": 1,
          "videoInfo.owner": 1
        }
      }
    ]);

    const numberOfLikedVideos = videos.length;

    return res
      .status(200)
      .json(new ApiResponse(200, "Fetched Liked videos successfully", {
        numberOfLikedVideos,
        videos
      }

      ))
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while getting liked videos", error))
  }


})

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos
}