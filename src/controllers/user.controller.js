import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';


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

    // Check if the username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        throw new ApiError(409, "User with this username already exists.");
    }
    // Check if the email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        throw new ApiError(409, "User with this email already exists.");
    }


    // now handling the file upload part
    console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    // Remove this check to make avatar optional
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is missing");
    // };

    let avatar = "", coverImage;
    if (avatarLocalPath) {
        try {
            const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
            avatar = uploadedAvatar.url;
            console.log("Uploaded avatar", uploadedAvatar);
        } catch (error) {
            console.log("Error uploading avatar!.", error);
            throw new ApiError(500, "Failed to upload avatar");
        }
    }
    // optionally uploading the coverImage
    if (coverImageLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
            console.log("Uploaded coverImage", coverImage);

        } catch (error) {
            console.log("Error uploading coverImage!.", error);
            throw new ApiError(500, "Failed to upload coverImage");
        }
    }

    // Now all data is taken from the user. Lets create user from data from the mongoose database.
    try {
        const user = await User.create({
            fullname,
            email,
            password,
            avatar: avatar, // Will be empty string if not uploaded
            coverImage: coverImage?.url || "", // DEFAULT_COVER_IMAGE can be used in place of "" but i handled it in front end
            username: username.toLowerCase(),
        });

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // finally to ensure that the user is created in database, again querying, for the realibility
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
            // -refreshToken
        )

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user.");
        }

        // Set cookie options
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None"
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {
                user: createdUser,
                accessToken,
                refreshToken
            }, "User registered successfully"));

    } catch {
        throw new ApiError(500, "Error while registering user");
    }


});

const loginUser = asyncHandler(async (req, res) => {
    // get data from body
    const { identifier, password } = req.body;

    // validation
    if (!identifier?.trim()) {
        throw new ApiError(400, "Email or Username is required");
    }
    if (!password?.trim()) {
        throw new ApiError(400, "Password is required");
    }

    try {

        // Dynamically build the query only with defined values


        // Fetch user using either email or username
        // const user = await User.findOne({ $or: [query] });

        // check for user
        // const user = await User.findOne({
        //     $or: [{ username }, { email }]
        // });

        let user;
        if (identifier.includes("@")) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ username: identifier.toLowerCase() });
        }

        if (!user) {
            throw new ApiError(404, "Invalid credentials.");
        };

        // Validate password
        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials.");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        // now that the user is logged in and the access and refresh tokens are generated
        // We have two options 1. Take existing user object and add Tokens to it
        //                      2. Fetch a new user object from the Database. (more reliable)

        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken");

        if (!loggedInUser) {
            return res.status(500).json(new ApiError(500, "Something went wrong while fetching user data."));
        }

        const options = {
            httpOnly: true, // makes the cookie non modiefiable from client side ... Prevents client-side access
            secure: process.env.NODE_ENV === "production",
            sameSite: "None"
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

    } catch (err) {
        console.log("Something went wrong while Logging in the user.", err.message);
        return res
            .status(err.statusCode || 500)
            .json(new ApiError(err.statusCode || 500, err.message || "Internal Server Error"));

    }
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
            secure: process.env.NODE_ENV === "production",
            signed: true, // Prevent tampering
            sameSite: "None",

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
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Refresh token expired, please log in again.");
        }
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid refresh token.");
        }
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
    // the user is verified after the 
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
    getUserChannelProfile
}