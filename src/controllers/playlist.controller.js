import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { Video } from '../models/video.models.js';


const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body
  //TODO: create playlist 
  if (!name) {
    return res.status(400).json(new ApiError(400, "Please provide name of the playlist"));
  }
  // description is optional

  // re-validating the user for confirmation
  if (!req.user || !req.user._id) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found"));
  }

  try {
    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user._id,
    })
    return res.status(200).json(new ApiResponse(200, "Created playlist successfully", playlist));
  } catch (error) {
    return res
      .status(404)
      .json(new ApiError(404, "Something went wrong while creating playlist", error));
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params
  //TODO: get user playlists
  // anyone can access the playlists of other users too
  // providing userId of that user

  if (!userId || !isValidObjectId(userId)) {
    return res
      .status(400)
      .json(new ApiError(400, "userId is invalid"))
  }

  // querying database to find the user for extra precausion
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404, "User not found"));
  }

  try {
    // get playlists
    const playlists = await Playlist.find({ owner: userId }).lean();
    playlists.forEach(playlist => {
      playlist.numberOfVideos = playlist.videos ? playlist.videos.length : 0;
    });
    const totalPlaylists = playlists.length;

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        `Fetched playlists successfully for user: ${userId}`,
        {
          totalPlaylists,
          playlists,
        }
      ));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while fetching user playlists"));
  }
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  //TODO: get playlist by id

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(400)
      .json(new ApiError(400, "playlistId is invalid"))
  }
  try {
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
      return res
        .status(404)
        .json(new ApiError(404, "Playlist not found"))
    }
    const numberOfVideos = playlist.videos.length
    return res
      .status(200)
      .json(new ApiResponse(200, "Found playlist successfully", {
        numberOfVideos,
        playlist
      }));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while finding playlist"))
  }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid playlist ID"))
  }
  if (!videoId || !isValidObjectId(videoId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid video ID"))
  }


  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res
        .status(404)
        .json(new ApiError(404, "Playlist not found"))
    }
    const video = await Video.findById(videoId);
    if (!video) {
      return res
        .status(404)
        .json(new ApiError(404, "Video not found"))
    }

    playlist.videos.push(video);
    await playlist.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Video added to playlist successfully", { video, playlist }))

  } catch (error) {
    return res
      .status(400)
      .json(new ApiError(400, "Something went wrong while adding video to the playlist", error))
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params
  // TODO: remove video from playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid playlist ID"))
  }
  if (!videoId || !isValidObjectId(videoId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid video ID"))
  }

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res
        .status(404)
        .json(new ApiError(404, "Playlist not found"))
    }

    const videoIndex = playlist.videos.findIndex(video => video._id.toString() === videoId);
    if (videoIndex === -1) {
      return res
        .status(404)
        .json(new ApiError(404, "Video not found in playlist"));
    }
    const video = playlist.videos[videoIndex];
    playlist.videos.splice(videoIndex, 1);
    await playlist.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Video removed from playlist successfully", {
        video,
        playlist
      }));

  } catch (error) {
    return res
      .status(400)
      .json(new ApiError(400, "Something went wrong while removing video from the playlist", error))
  }


})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  // TODO: delete playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid playlist ID"))
  }

  try {
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(new ApiResponse(
        200,
        "Deleted playlist successfully",
        playlist
      ));
  } catch (error) {
    return res
      .status(400)
      .json(new ApiError(400, "Something went wrong while deleting the playlist", error))
  }

})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body
  //TODO: update playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid playlist ID"))
  }

  // if fields are provided and are non null then store them in seperate object
  const updateFields = {};
  if (name !== undefined) {
    if (!name) {
      return res
        .status(400)
        .json(new ApiError(400, "Please provide a valid name for the playlist"));
    }
    updateFields.name = name;
  }
  if (description !== undefined) {
    if (!description) {
      return res
        .status(400)
        .json(new ApiError(400, "Please provide a valid description for the playlist"));
    }
    updateFields.description = description;
  }

  try {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      updateFields,
      { new: true }
    );

    if (!updatedPlaylist) {
      return res
        .status(404)
        .json(new ApiError(404, "Playlist not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Updated playlist successfully", updatedPlaylist));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while updating the playlist", error));
  }


})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}