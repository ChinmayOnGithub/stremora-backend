import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { parentId } = req.params; // videoId or tweetId
  const { parentType } = req.query; // "Video" or "Tweet"
  const { page = 1, limit = 10 } = req.query; // used for pagination. Only limited numbers of comments will be loaded

  if (process.env.NODE_ENV === 'development') {
    console.log("Received Params:", req.params);
    console.log("Received Query:", req.query);
  }


  if (!parentId || !isValidObjectId(parentId)) {
    return res.status(400).json(new ApiError(400, "Parent ID is not valid"));
  }
  if (!["Video", "Tweet"].includes(parentType)) {
    return res.status(400).json(new ApiError(400, "Invalid parentType"));
  }

  try {
    const comments = await Comment.find({ parent: parentId, parentType })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10)) // skip the comments from prev page
      .limit(parseInt(limit, 10)) // limit number of comments (documents) on a single page
      .populate('owner', 'username email avatar')
      .exec();


    const totalComments = await Comment.countDocuments({ parent: parentId, parentType });


    return res.status(200).json(
      new ApiResponse(200, "Fetched comments successfully", {
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

  const { parentId } = req.params; // videoId or tweetId
  const { parentType } = req.query; // "Video" or "Tweet"
  const { content } = req.body;
  const userId = req.user?._id;

  if (!parentId || !["Video", "Tweet"].includes(parentType)) {
    return res.status(400).json(new ApiError(400, "Invalid parent ID or type"));
  }

  if (!userId) {
    return res.status(401).json(new ApiError(401, "User not authenticated"));
  }

  if (!content) {
    return res
      .status(400)
      .json(new ApiError(400, "Content is required"))
  }
  if (!parentId || !isValidObjectId(parentId)) {
    return res
      .status(400)
      .json(new ApiError(400, `${parentType} id is not valid`))
  }

  try {

    const comment = await Comment.create({
      content,
      owner: req.user._id,
      parent: parentId,
      parentType

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
  const { parentId, commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;


  if (!content || content.trim() === "") {
    return res
      .status(400)
      .json(new ApiError(400, "Content is required"));
  }
  if (!parentId || !isValidObjectId(parentId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid parent ID"));
  }
  if (!commentId || !isValidObjectId(commentId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid comment ID"));
  }
  try {
    const comment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        parent: parentId,
        owner: userId
      },
      { content },
      { new: true }
    ).exec();


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
  const { parentId, commentId } = req.params;
  const userId = req.user?._id;


  if (!parentId || !isValidObjectId(parentId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid parent ID"));
  }
  if (!commentId || !isValidObjectId(commentId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid comment ID"));
  }


  try {
    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      parent: parentId,
      owner: userId,
    }).exec();

    if (!comment) {
      return res.status(404).json(new ApiError(404, "Comment not found or unauthorized"));
    }

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