import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';
import { Subscription } from '../models/subscription.models.js';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import multer from "multer";
import { upload } from '../middlewares/multer.middleware.js';
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh tokens  ")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;
    // we are also injecting images but they are not included in the req.body
    // they are in req.files

    // validation
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required.");
    }

    // check if user already existed
    // its a database operation so use await.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "User with given email or username already exists");
    };

    // now handling the file upload part
    console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    };


    // uploading on cloudinary
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = "";

    // if (coverImageLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("Uploaded avatar", avatar);

    } catch (error) {
        console.log("Error uploading avatar!.", error);
        throw new ApiError(500, "Failed to upload avatar");
    }
    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log("Uploaded coverImage", coverImage);

    } catch (error) {
        console.log("Error uploading coverImage!.", error);
        throw new ApiError(500, "Failed to upload coverImage");
    }


    // Now all data is taken from the user. Lets create user from data from the mongoose database.
    try {
        const user = await User.create({
            fullname,
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            username: username.toLowerCase(),
        });

        // finally to ensure that the user is created in database, again querying, for the realibility
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user.");
        }

        return res
            .status(201)
            .json(new ApiResponse(200, createdUser, "User registered successfully"))
    } catch (error) {
        console.log("User Creation failed.");

        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "Something went wrong while registering the user and images were deleted");
    }


});

const loginUser = asyncHandler(async (req, res) => {
    // get data from body
    const { email, username, password } = req.body;

    // validation
    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    if (!password?.trim()) {
        throw new ApiError(400, "Password is required");
    }


    // check for user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ApiError(409, "User not found. Please Register.");
    };


    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect / invalid");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    // now that the user is logged in and the access and refresh tokens are generated
    // We have two options 1. Take existing user object and add Tokens to it
    //                      2. Fetch a new user object from the Database. (more reliable)

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    if (!loggedInUser) {
        // TODO for you
    }

    const options = {
        httpOnly: true, // makes the cookie non modiefiable from client side
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken }, // This is backup for mobile because we can not store cookies on mobile devices. Hence also providing accessToken and refreshToken ((Mobile APP)) because backend can have any frontend.
            "User logged in successfully!"
        ));

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined, // can use "" or null
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;  // changed accessToken to refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    // now to verify the refreshToken from the databases use trycatch
    try {
        // this decode the token and hence we can access the payload
        // also checks for the expiration of the refreshToken
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const options = {
            httpOnly: true,
            secur: process.env.NODE_ENV === "production",
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing the access token");

    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id)

    if (!user) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "User not found"));
    }


    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        // throw new ApiError(401, "Old password is incorrect");
        return res.status(401).json(new ApiResponse(401, null, "Old password is incorrect"));

    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user details"))

})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "Fullname and email are required");
    }

    // lets change the values in the database 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true } // this change is made by me personally if something goes wrong delete this.
    ).select(
        "-password -refreshToken"
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})


const updateUserAvatar = asyncHandler(async (req, res) => {
    console.log("req.file: ", req.file);
    // console.log("req.body: ", req.body);

    if (!req.file || !req.file.path) {
        throw new ApiError(404, "File is required");
    }

    const avatarLocalPath = req.file.path;

    if (!avatarLocalPath.trim()) {
        throw new ApiError(404, "File-path is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "Something went wrong while (updating) uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))

})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "File is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new Error("Something went wrong while uploading cover");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(404, "Username is required");
    }

    // channel as an array
    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                // Project only the necessary data
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    coverImage: 1,
                    email: 1,
                }
            }
        ]
    )

    console.log(channel); // console log

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200,
            channel[0],
            "Channel profile fetched successfully"
        ))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    console.log(user);


    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user[0]?.watchHistory,
            "Watch history fetched successfully"
        ))
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}