import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query; // used for pagination. Only limited numbers of comments will be loaded

  if (!videoId || !isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Video id is not valid"));
  }

  try {
    const comments = await Comment.find({ video: videoId })
      .skip((page - 1) * limit) // skip the comments from prev page
      .limit(parseInt(limit)) // limit number of comments (documents) on a single page
      .exec();

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(new ApiResponse(200, "Fetched comments successfully", {
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page,
      comments
    }));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong while fetching comments", error));
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // user is already verified using auth function

  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json(new ApiError(401, "User not authenticated"));
  }

  if (!content) {
    return res
      .status(400)
      .json(new ApiError(400, "Content is required"))
  }
  if (!videoId || !isValidObjectId(videoId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Video id is not valid"))
  }

  try {

    const comment = await Comment.create({
      content,
      video: videoId,
      owner: userId
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Added comment successfully", comment))

  } catch (error) {
    console.log("Cant add a comment");

    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while adding comment", error));
  }

});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { videoId, commentId } = req.params
  const { content } = req.body

  if (!content) {
    return res
      .status(400)
      .json(new ApiError(400, "Content is required"))
  }
  if (!videoId || !isValidObjectId(videoId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Video id is not valid"))
  }

  try {

    if (!commentId || !isValidObjectId(commentId)) {
      return res.status(400).json(new ApiError(400, "Comment id is not valid"));
    }

    const comment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        video: videoId,
        owner: req.user?._id
      },
      { content },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json(new ApiError(404, "Comment not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Updated comment successfully", comment))

  } catch (error) {
    console.log("Cant update a comment");

    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while updating the comment", error));
  }

});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { videoId, commentId } = req.params

  if (!videoId || !isValidObjectId(videoId)) {
    return res
      .status(400)
      .json(new ApiError(400, "video id not valid"));
  }
  if (!commentId || !isValidObjectId(commentId)) {
    return res
      .status(400)
      .json(new ApiError(400, "comment id not valid"));
  }

  try {
    const comment = await Comment.findOneAndDelete(
      {
        video: videoId,
        owner: req.user?._id,
        _id: commentId
      }
    )

    return res
      .status(200)
      .json(new ApiResponse(200, "Successfully deleted the comment", comment))

  } catch (error) {
    return res
      .status(400)
      .json(new ApiError(400, "Something went wrong while deleting the comment", error));
  }
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}