import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos,
  getAllLikes,
  checkLikeStatus
} from "../controllers/like.controller.js"

const router = Router();

// secure routes
router.route("/toggle-video-like/:videoId").post(verifyJWT, toggleVideoLike)
router.route("/toggle-comment-like/:commentId").post(verifyJWT, toggleCommentLike)
router.route("/toggle-tweet-like/:tweetId").post(verifyJWT, toggleTweetLike)
router.route("/get-liked-videos").get(verifyJWT, getLikedVideos)
router.route("/check-like").get(verifyJWT, checkLikeStatus)
router.route("/debug/all-likes").get(getAllLikes) // Debug route (no auth required)

export default router