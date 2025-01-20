import { Router } from "express";
import { toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router()

// secure routes
router.route("/toggle-subscription/:channelId").post(verifyJWT, toggleSubscription);

// not secure routes


export default router;
