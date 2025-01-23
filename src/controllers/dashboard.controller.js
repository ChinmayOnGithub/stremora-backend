import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from '../models/user.models.js';


const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(404).json(new ApiError(404, "Channel ID invalid"));
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    return res.status(404).json(new ApiError(404, "Channel not found"));
  }

  try {

    // find total subscribers of the channel
    const subscribers = await Subscription.find({ channel: new mongoose.Types.ObjectId(channelId) });
    const subscriberCount = subscribers.length; // just counting the number of documents fetched in the subscribers

    // find number of videos published (uploaded)
    const videos = await Video.find({ owner: new mongoose.Types.ObjectId(channelId) });
    const videoCount = videos.length;

    // find out number of views
    let viewCount = 0;
    videos.forEach(vid => {
      viewCount += vid.views;
    });


    // find out total likes
    // this seems complicated because we dont know the owner of the videos, tweets and comments to which like is assigned

    let likeCount = 0;

    // little confused yet dont know how to use that $in 
    const likes = await Like.aggregate([
      {
        $match: {
          video: { $in: videos.map(vid => vid._id) }
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: 1 }
        }
      }
    ]);

    likeCount = likes.length > 0 ? likes[0].totalLikes : 0;

    return res.status(200).json(new ApiResponse(200, "Successfully fetched channel data",
      {
        subscriberCount,
        videoCount,
        viewCount,
        likeCount
      }
    ))

  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong while fetching the dashboard stats", error));

  }

})

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
})

export {
  getChannelStats,
  getChannelVideos
}