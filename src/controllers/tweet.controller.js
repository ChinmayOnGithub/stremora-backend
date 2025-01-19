import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const user = await User.findById(req.user);
  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found | please login to create your own tweet"));
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json(new ApiError(400, "Content is required"));
  }

  try {
    const tweet = await Tweet.create({
      content,
      owner: user._id
    });

    return res.status(201).json(new ApiResponse(201, "Created Tweet successfully", tweet));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong while creating a tweet", error));
  }
})

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params

  if (!userId || !isValidObjectId(userId)) {
    return res.status(400).json(new ApiError(400, "Invalid user ID"))
  }

  try {
    const channel = await Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId), // Match tweets by userId first
        },
      },
      {
        $group: {
          _id: "$owner", // Group tweets by owner
          tweetCount: { $sum: 1 }, // Count tweets
          tweets: { $push: "$$ROOT" }, // Push all tweet details into an array
        },
      },
      {
        $project: {
          _id: 0,
          owner: "$_id", // Rename _id to owner
          tweetCount: 1,
          tweets: {
            _id: 1,
            content: 1,
            createdAt: 1,
          }, // Include specific tweet fields
        },
      },
    ]);


    console.log(channel);
    if (!channel || channel.length === 0) {
      return res.status(404).json(new ApiError(404, "No tweets found for the user"));
    }

    return res.status(200).json(new ApiResponse(200, "Successfully aggregated all tweets", channel))
  } catch (error) {
    console.error("Error while getting user tweets:", error);
    return res.status(500).json(new ApiError(500, "Error while getting all tweets of a user", error))
  }

});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !isValidObjectId(tweetId)) {
    return res.status(400).json(new ApiError(400, "Invalid tweet ID"));
  }

  if (!content || !content.trim()) {
    return res.status(400).json(new ApiError(400, "Content is required"));
  }

  try {
    const tweet = await Tweet.findOneAndUpdate(
      { _id: tweetId, owner: req.user._id },
      { content },
      { new: true, runValidators: true }
    );

    if (!tweet) {
      return res.status(404).json(new ApiError(404, "Tweet not found or you are not authorized to update this tweet"));
    }

    return res.status(200).json(new ApiResponse(200, "Updated Tweet successfully", tweet));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong while updating the tweet", error));
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  console.log("start");

  //TODO: delete tweet
  const { tweetId } = req.params

  if (!tweetId || !isValidObjectId(tweetId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid tweet ID"));
  }

  try {
    const tweet = await Tweet.findByIdAndDelete(
      { _id: tweetId, owner: req.user._id }
    )

    if (!tweet) {
      return res
        .status(404)
        .json(new ApiError(404, "Tweet you searched for is not found or You are not authorised to delete this tweet"))
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Successfully deleted the Tweet", tweet));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while deleting the tweet", error))
  }
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
}