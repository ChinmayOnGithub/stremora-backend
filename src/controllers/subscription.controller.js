import mongoose, { isValidObjectId } from "mongoose"
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

  if (!channelId || !isValidObjectId(channelId)) {
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
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}