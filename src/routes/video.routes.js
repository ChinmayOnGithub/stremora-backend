import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// secure routes that need to be signed in 
router.route("/publish").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        },
    ]),
    publishAVideo);
router.route("/update-video/:videoId").patch(
    verifyJWT,
    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    updateVideo
)
router.route("/delete-video/:videoId").delete(
    verifyJWT,
    deleteVideo
)
router.route("/toggle-published/:videoId").patch(
    verifyJWT,
    togglePublishStatus
)


// routes accessed by anyone
router.route("/get-video").get(getAllVideos);
router.route("/get-video-by-id/:videoId").get(getVideoById)



export default router