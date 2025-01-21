import { Router } from "express";
import { getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getUserChannelProfile } from "../controllers/user.controller.js";

const router = Router()

// secure routes
router.route("/toggle-subscription/:channelId").post(verifyJWT, toggleSubscription);

// not secure routes
router.route("/get-subscriber-count/:channelId").get(getUserChannelSubscribers);


export default router;
