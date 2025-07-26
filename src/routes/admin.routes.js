// routes/admin.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  getAllPlaylists, deletePlaylistById,
  getAllComments, deleteCommentById,
  getAllHistory, deleteHistoryById,
  getAllLikes, deleteLikeById,
  getAllSubscriptions, deleteSubscriptionById,
  getAllTweets, deleteTweetById,
  getAllUsers, deleteUserById,
  getAllVideos, deleteVideoById
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(verifyJWT);
router.use(requireAdmin);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUserById);

// Video management
router.get("/videos", getAllVideos);
router.delete("/videos/:id", deleteVideoById);

// Playlist management
router.get("/playlists", getAllPlaylists);
router.delete("/playlists/:id", deletePlaylistById);
// Comment management
router.get("/comments", getAllComments);
router.delete("/comments/:id", deleteCommentById);
// History management
router.get("/history", getAllHistory);
router.delete("/history/:id", deleteHistoryById);
// Like management
router.get("/likes", getAllLikes);
router.delete("/likes/:id", deleteLikeById);
// Subscription management
router.get("/subscriptions", getAllSubscriptions);
router.delete("/subscriptions/:id", deleteSubscriptionById);
// Tweet management
router.get("/tweets", getAllTweets);
router.delete("/tweets/:id", deleteTweetById);

export default router;
