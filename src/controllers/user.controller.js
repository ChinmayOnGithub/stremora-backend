import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { uploadWithFallback, deleteFromStorage } from "../utils/storage.js";
import jwt from 'jsonwebtoken';
import { emailService } from "../utils/emailService.js";
import crypto from 'crypto';
import { sendEmail } from "../utils/emailService.js";


// const generateAccessAndRefreshToken = async (userId) => {
//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             throw new ApiError(404, "User not found");
//         }

//         const accessToken = user.generateAccessToken();
//         const refreshToken = user.generateRefreshToken();

//         user.refreshToken = refreshToken;
//         await user.save({ validateBeforeSave: false });

//         return { accessToken, refreshToken }

//     } catch (error) {
//         throw new ApiError(500, "Failed to generate access and refresh tokens  ")
//     }
// };

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // CRITICAL FIX: Convert to string to ensure proper storage and comparison
        user.refreshToken = refreshToken.toString();
        await user.save({ validateBeforeSave: false });


        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Error generating tokens:", error);

        // If it's already an ApiError, throw it as-is to preserve the status code
        if (error instanceof ApiError) {
            throw error;
        }

        // For unexpected errors, throw a 500
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }
};


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


    // Avatar and cover image are now completely optional - no file handling needed during registration
    let avatar = "";
    let coverImage = "";

    // Now all data is taken from the user. Lets create user from data from the mongoose database.
    // try {
    //     const user = await User.create({
    //         fullname,
    //         email,
    //         password,
    //         avatar: avatar, // Will be empty string if not uploaded
    //         coverImage: coverImage?.url || "", // DEFAULT_COVER_IMAGE can be used in place of "" but i handled it in front end
    //         username: username.toLowerCase(),
    //     });

    //     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    //      // not good practice to do this.

    //     // finally to ensure that the user is created in database, again querying, for the realibility
    //     const createdUser = await User.findById(user._id).select(
    //         "-password -refreshToken"
    //         // -refreshToken
    //     )

    //     if (!createdUser) {
    //         throw new ApiError(500, "Something went wrong while registering the user.");
    //     }

    //     // Set cookie options
    //     const options = {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === "production",
    //         sameSite: "None"
    //     };

    //     return res
    //         .status(201)
    //         .cookie("accessToken", accessToken, options)
    //         .cookie("refreshToken", refreshToken, options)
    //         .json(new ApiResponse(200, {
    //             user: createdUser,
    //             accessToken,
    //             refreshToken
    //         }, "User registered successfully"));

    // } catch {
    //     throw new ApiError(500, "Error while registering user");
    // }

    // Now all data is taken from the user. Lets create user from data from the mongoose database.
    try {
        const user = await User.create({
            fullname,
            email,
            password,
            avatar: avatar, // Will be empty string if not uploaded
            coverImage: coverImage?.url || "", // DEFAULT_COVER_IMAGE can be used in place of "" but i handled it in front end
            username: username.toLowerCase(),
            // IMPORTANT: Email starts as unverified
            isEmailVerified: false
        });

        // *** REMOVE THE TOKEN GENERATION - USERS CAN'T LOGIN WITHOUT VERIFICATION ***
        // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // Generate verification code and send email
        const verificationCode = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Get frontend URL from request origin or fallback to env
        const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
        const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];

        await emailService.sendVerificationEmail(
            user.email,
            verificationCode,
            user.fullname,
            null,
            frontendUrl
        );

        // Get user without sensitive information
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken"
        );

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user.");
        }

        // *** NO COOKIES ARE SET - USER CANNOT LOGIN YET ***
        // DO NOT set cookies or return tokens

        return res
            .status(201)
            .json(new ApiResponse(201, {
                user: createdUser,
                requiresVerification: true,
                message: "Please check your email for verification code"
            }, "User registered successfully. Email verification required."));

    } catch (error) {
        console.error("Registration error:", error);
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

        // Block login if the user's email is not verified.
        if (!user.isEmailVerified) {
            throw new ApiError(403, "Email not verified. Please check your inbox for a verification code.");
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

// const refreshAccessToken = asyncHandler(async (req, res) => {
//     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;  // changed accessToken to refreshToken

//     if (!incomingRefreshToken) {
//         throw new ApiError(401, "Refresh token is required");
//     }

//     // now to verify the refreshToken from the databases use trycatch
//     try {
//         // this decode the token and hence we can access the payload
//         // also checks for the expiration of the refreshToken
//         const decodedToken = jwt.verify(
//             incomingRefreshToken,
//             process.env.REFRESH_TOKEN_SECRET,
//         )

//         const user = await User.findById(decodedToken?._id);
//         if (!user) {
//             throw new ApiError(401, "Invalid refresh token");
//         }

//         if (incomingRefreshToken !== user?.refreshToken) {
//             throw new ApiError(401, "Invalid refresh token");
//         }

//         const options = {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             signed: true, // Prevent tampering
//             sameSite: "None",

//         }

//         const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

//         return res
//             .status(200)
//             .cookie("accessToken", accessToken, options)
//             .cookie("refreshToken", newRefreshToken, options)
//             .json(
//                 new ApiResponse(
//                     200,
//                     {
//                         accessToken,
//                         refreshToken: newRefreshToken
//                     },
//                     "Access token refreshed successfully"));

//     } catch (error) {
//         if (error.name === "TokenExpiredError") {
//             throw new ApiError(401, "Refresh token expired, please log in again.");
//         }
//         if (error.name === "JsonWebTokenError") {
//             throw new ApiError(401, "Invalid refresh token.");
//         }
//         throw new ApiError(500, "Something went wrong while refreshing the access token");
//     }
// })

// In stremora-backend/src/controllers/user.controller.js

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;


    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        // Verify the token first - this will throw if invalid/expired
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );


        const user = await User.findById(decodedToken?._id);
        if (!user) {
            console.log("User not found for ID:", decodedToken?._id);
            throw new ApiError(401, "Invalid refresh token - user not found");
        }


        // CRITICAL FIX: Ensure string comparison
        const storedToken = user.refreshToken ? user.refreshToken.toString() : null;
        const incomingToken = incomingRefreshToken.toString();

        if (incomingToken !== storedToken) {
            throw new ApiError(401, "Refresh token is expired or has been used");
        }


        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };

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
                    "Access token refreshed successfully"
                )
            );

    } catch (error) {
        console.error("Refresh token error:", error.name, error.message);

        // Handle specific JWT errors
        if (error.name === "TokenExpiredError") {
            console.log("Refresh token expired");
            throw new ApiError(401, "Refresh token expired, please log in again");
        }

        if (error.name === "JsonWebTokenError") {
            console.log("Invalid JWT structure");
            throw new ApiError(401, "Invalid refresh token format");
        }

        // If it's already an ApiError, throw it as-is
        if (error instanceof ApiError) {
            throw error;
        }

        // Log unexpected errors for debugging
        console.error("Unexpected refresh token error:", error);
        throw new ApiError(401, "Invalid refresh token");
    }
});


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

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath || !avatarLocalPath.trim()) {
        throw new ApiError(400, "Avatar file is required");
    }

    console.log("[Uploading avatar...");
    const avatar = await uploadWithFallback(avatarLocalPath, req.file.mimetype, 'avatars');

    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed - both Cloudinary and S3 failed");
    }

    const avatarUrl = avatar.secure_url || avatar.url;
    if (!avatarUrl) {
        throw new ApiError(500, "Avatar upload returned no URL");
    }

    console.log("[Avatar uploaded:", avatarUrl);

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatarUrl,
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
        throw new ApiError(400, "Cover image file is required");
    }

    console.log("[Uploading cover image...");
    const coverImage = await uploadWithFallback(coverImageLocalPath, req.file.mimetype, 'covers');
    
    if (!coverImage) {
        throw new ApiError(500, "Cover image upload failed - both Cloudinary and S3 failed");
    }

    const coverImageUrl = coverImage.secure_url || coverImage.url;
    if (!coverImageUrl) {
        throw new ApiError(500, "Cover image upload returned no URL");
    }

    console.log("[Cover image uploaded:", coverImageUrl);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImageUrl
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

// Forgot Password - Send reset email
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Don't reveal if user exists or not (security best practice)
        return res.status(200).json(
            new ApiResponse(200, null, "If an account exists with this email, you will receive a password reset link")
        );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Get frontend URL from request origin or fallback to env
    const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];
    
    // Create reset URL
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
        // Send email
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.fullname},</p>
                <p>You requested to reset your password. Click the link below to reset it:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        return res.status(200).json(
            new ApiResponse(200, null, "Password reset link sent to your email")
        );
    } catch (error) {
        // Clear reset token if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new ApiError(500, "Error sending email. Please try again later.");
    }
});

// Reset Password - Verify token and update password
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // Hash the token from URL to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Password reset successful. You can now login with your new password.")
    );
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
    forgotPassword,
    resetPassword
}