import { Router } from "express"
import {
  createPlaylist,
  getPlaylistById,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()

// secure routes
router.route("/create-playlist").post(verifyJWT, createPlaylist);


// non secure routes
router.route("/get-user-playlist/:userId").get(getUserPlaylists);
router.route("/get-playlist-by-id/:playlistId").get(getPlaylistById);
router.route("/add-video-to-playlist/:playlistId/:videoId").post(addVideoToPlaylist)
router.route("/remove-video-from-playlist/:playlistId/:videoId").post(removeVideoFromPlaylist)
router.route("/delete-playlist/:playlistId").delete(deletePlaylist)
router.route("/update-playlist/:playlistId").patch(updatePlaylist)


export default router;