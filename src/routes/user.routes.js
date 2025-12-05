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
    forgotPassword,
    resetPassword
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

// Username availability check
router.route("/check-username/:username").get(async (req, res) => {
    try {
        const { username } = req.params;
        const existingUser = await import('../models/user.models.js').then(m => m.User.findOne({ username: username.toLowerCase() }));
        return res.status(200).json({
            success: true,
            data: {
                available: !existingUser,
                username
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error checking username availability"
        });
    }
})


router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password/:token").post(resetPassword)
// user should be able to access other channel without login
router.route("/c/:username").get(getUserChannelProfile)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)


router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)


export default router