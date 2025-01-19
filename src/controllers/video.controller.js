import { Video } from '../models/video.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { mongoose } from 'mongoose';
import {
    uploadOnCloudinary,
    deleteFromCloudinary
} from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filter = {};
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

    // using pagination while getting data from database
    const videos = await Video
        .find(filter)
        .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit) // skip prev pages
        .limit(limit); // limits number of documents in one page

    res
        .status(200)
        .json(new ApiResponse(200, "Videos fetched successfully", videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // // TODO: get video, upload to cloudinary, create video
    // Validate user input
    if (!title?.trim()) {
        return res.status(400).json(new ApiError(400, "Title is required"));
    }
    if (!description?.trim()) {
        return res.status(400).json(new ApiError(400, "Description is required"));
    }
    // first validate the user
    const user = await User.findById(req.user?._id);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found!"));
    }
    // lets handle the video upload part
    let videoLocalPath = req.files?.videoFile?.[0]?.path;
    let thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if (!videoLocalPath) {
        return res.status(404).json(new ApiError(404, "Video file is required"));
    }
    // Thumbnail is optional
    let thumbnail = null;
    if (thumbnailLocalPath) {
        try {
            thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        } catch (error) {
            console.log("Error uploading thumbnail!.", error);
            throw new ApiError(500, "Failed to upload thumbnail file");
        }
    }
    let videoCloudinary = null;
    try {
        videoCloudinary = await uploadOnCloudinary(videoLocalPath)
    } catch (error) {
        console.log("Error uploading video!.", error);
        throw new ApiError(500, "Failed to upload video file");
    }
    // now that the video uploaded to the cloudanary 
    // lets create a video with all the components and link and store it in the datebase
    try {
        const video = new Video({
            videoFile: videoCloudinary.url, // need to mention url becuase the videoCloudinary is actually an Object
            thumbnail: thumbnail.url || "",
            title,
            description,
            duration: 15,
            owner: user._id
        });

        const publishedVideo = await video.save();

        if (!publishedVideo) {
            throw new ApiError(500, "Something went wrong while publishing the video.");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Successfully published video", publishedVideo))

    } catch (error) {
        console.log("Video creation failed.", error);
        if (videoCloudinary) {
            await deleteFromCloudinary(videoCloudinary.public_id)
        }
        if (thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id)
        }
        throw new ApiError(500, "Something went wrong while publishing the video and files were deleted");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // params are taken from the :videoId from url itself
    // Validate videoId
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }
    // Find video by id
    try {
        const video = await Video.findById(videoId);

        if (!video) {
            console.log("Video not found");
            return res.status(404).json(new ApiError(404, "Video not found"));
        }
        return res
            .status(200)
            .json(new ApiResponse(200, "Fetched video by ID successfully", video));
    } catch (error) {
        console.log("Error while finding the video", error);
        return res
            .status(500)
            .json(new ApiError(500, "Error while finding the video", error));
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        console.log("Invalid videoId");
        return res.status(400).json(new ApiError(400, "Valid Video ID is required"));
    }

    const { title, description } = req.body;

    // optionally update whatever is provided
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;



    // now update the thumbnail (optionally)
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    let thumbnail;
    if (thumbnailLocalPath) {
        try {
            // Find the existing video to get the current thumbnail public_id
            const existingVideo = await Video.findById(videoId);
            if (existingVideo && existingVideo.thumbnail) {
                // Delete the old thumbnail from Cloudinary
                await deleteFromCloudinary(existingVideo.thumbnail);
            }

            // Upload the new thumbnail to Cloudinary
            thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        } catch (error) {
            return res.status(500).json(new ApiError(500, "Error while uploading the thumbnail!"));
        }
    }

    if (thumbnail) updateFields.thumbnail = thumbnail.url;

    // update all the fields
    try {
        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: updateFields
            },
            {
                new: true
            }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, "Updated video details successfully", video))
    } catch (error) {
        console.log("couldnt update the details");

        return res.status(500).json(new ApiError(404, "Error while updating the video details"))
    }


})

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
    } catch (error) {
        return res
            .status(500)
            .json(new ApiError(500, "Something went wrong while deleting the video"));
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

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
