import { Router } from "express";
import {
  getChannelStats
} from "../controllers/dashboard.controller.js";

const router = Router();


// secure routes



// non secure routes
router.route("/get-channel-stats/:channelId").get(getChannelStats)


export default router