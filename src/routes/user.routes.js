import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// unsecured routes

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)


router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
// user should be able to access other channel without login
router.route("/c/:username").get(getUserChannelProfile)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").put(verifyJWT, updateAccountDetails)

router.route("/update-avatar").put(verifyJWT, upload.single("avatar"), updateUserAvatar)


router.route("/update-cover-image").put(verifyJWT, upload.single("cover-image"), updateUserCoverImage)

router.route("/history").get(verifyJWT, getWatchHistory)


export default router