import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
  getHistoryStats,
  updateWatchProgress
} from "../controllers/history.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Add video to history
router.route("/add/:videoId").post(addToHistory);

// Get user's watch history
router.route("/").get(getHistory);

// Remove video from history
router.route("/remove/:videoId").delete(removeFromHistory);

// Clear entire history
router.route("/clear").delete(clearHistory);

// Get history statistics
router.route("/stats").get(getHistoryStats);

// Update watch progress
router.route("/progress/:videoId").put(updateWatchProgress);

export default router; 