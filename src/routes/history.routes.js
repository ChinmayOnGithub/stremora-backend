import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getHistory,
  removeFromHistory,
  clearHistory,
  getHistoryStats
} from "../controllers/history.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Get user's watch history
router.route("/").get(getHistory);

// Remove video from history
router.route("/remove/:videoId").delete(removeFromHistory);

// Clear entire history
router.route("/clear").delete(clearHistory);

// Get history statistics
router.route("/stats").get(getHistoryStats);

export default router; 