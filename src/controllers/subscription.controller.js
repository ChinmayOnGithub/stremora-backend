import mongoose from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params
  // TODO: toggle subscription

  //revalidate if user exist else tell him to sign in 
  const user = await User.findById(req.user?._id)
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404, "Please sign in to subscribe"))
  }

  if (!channelId || !mongoose.isValidObjectId(channelId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Channel ID not valid"))
  }

  const channel = await User.findById(channelId)
  if (!channel) {
    return res
      .status(404)
      .json(new ApiError(404, "Channel not found"))
  }
  // whoever is the user... want to subscribe or unsubscribe to the channel.

  // You can not subscribe your own channel
  if (user._id.equals(channelId)) {
    return res.status(400).json(new ApiError(400, "You cannot subscribe to your own channel"));
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId
  })

  if (existingSubscription) {
    const subscription = await Subscription.findOneAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Removed subscription successfully", subscription));

  } else {
    try {
      const subscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
      });
      return res
        .status(200)
        .json(new ApiResponse(200, "Added subscription successfully", subscription));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "Something went wrong while adding a subscription", error));
    }
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  // dont need user verification
  if (!channelId || !mongoose.isValidObjectId(channelId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Channel ID not valid"))
  }

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json(new ApiError(400, "Invalid Channel ID"));
  }


  const channelOwner = await User.findById(channelId);
  if (!channelOwner) {
    return res
      .status(404)
      .json(new ApiError(404, "Channel not found"))
  }
  try {
    console.log("Fetching subscribers for channel:", channelId);

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId), // Convert to ObjectId
        },
      },
      {
        $lookup: {
          from: "users", // Ensure this matches the collection name
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriberDetails",
        },
      },
      {
        $unwind: {
          path: "$subscriberDetails",
          preserveNullAndEmptyArrays: true, // Prevent errors when no match
        },
      },
      {
        $project: {
          subscriber: 1,
          subscriberDetails: 1,
        },
      },
    ]);

    console.log("Subscribers fetched:", subscribers);

    return res.status(200).json(
      new ApiResponse(200, "Successfully fetched subscribers", {
        subscriberCount: subscribers.length,
        subscribers,
      })
    );
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return res.status(500).json(new ApiError(500, "An error occurred", { error: error.message }));
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params

  //  This is not secure route
  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    return res.status(400).json(new ApiError(400, "Invalid Channel ID"));
  }

  const user = await User.findById(subscriberId);
  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found"))
  }

  try {
    const channels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        }
      },
      {
        $lookup: {
          from: "users", // Ensure this matches the collection name
          localField: "channel",
          foreignField: "_id",
          as: "channelDetails",
        }
      },
      {
        $unwind: {
          path: "$channelDetails",
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $project: {
          "channelDetails.password": 0, // Exclude password
          "channelDetails.refreshToken": 0 // Exclude refreshToken        }
        }
      }
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, "Fetched user subscribed channels successfully",
        {
          channelsCount: channels.length,
          channels
        }
      ));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while fetching channels subscribed",
        error
      ));
  }

})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}