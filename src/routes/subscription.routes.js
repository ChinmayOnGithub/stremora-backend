import { Router } from "express";
import { toggleSubscription } from "../controllers/subscription.controller";

const router = Router()

router.route("/toggle-subscription/:channelId").post(toggleSubscription)


export default router;
