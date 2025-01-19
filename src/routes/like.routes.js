import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
} from "../controllers/like.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { getAllVideos } from "../controllers/video.controller.js";


const router = Router();

// secure routes
router.route("/toggle-video-like/:videoId").post(verifyJWT, toggleVideoLike)
router.route("/toggle-comment-like/:commentId").post(verifyJWT, toggleCommentLike)
router.route("/toggle-tweet-like/:tweetId").post(verifyJWT, toggleTweetLike)
router.route("/get-liked-videos").get(verifyJWT, getLikedVideos)

export default router