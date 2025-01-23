import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos
} from "../controllers/dashboard.controller.js";

const router = Router();


// secure routes



// non secure routes
router.route("/get-channel-stats/:channelId").get(getChannelStats)
router.route("/get-channel-videos/:channelId").get(getChannelVideos)


export default router