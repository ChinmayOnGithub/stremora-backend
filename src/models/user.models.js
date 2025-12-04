/* 
id string pk (automatically added by mongoose)
username string 
email string
fullName string
avatar string 
coverImage string
warchHistory ObjectId[] videos
password string
refreshToken string
createdAt Date
updatedAt Date
*/

import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DEFAULT_COVER_IMAGE } from "../constants.js";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudanary URL
            // required: true, // Make avatar optional
        },
        coverImage: {
            type: String, //cloudanary URL
            default: DEFAULT_COVER_IMAGE
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId, // needs a reference
                ref: "Video",
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"],
        },
        refreshToken: {
            type: String,
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            default: null
        },
        emailVerificationLinkToken: {
            type: String,
            default: null
        },
        emailVerificationExpires: {
            type: Date,
            default: null
        },
        passwordResetToken: {
            type: String,
            default: null
        },
        passwordResetExpires: {
            type: Date,
            default: null
        }
    },
    { timestamps: true } // createdAt and updatedAt is added here
)

// HOOKS
// Pre-save hook to hash password before saving
userSchema.pre("save", async function () {
    // In newer Mongoose versions, next() is not needed for async functions
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

// JWT token
userSchema.methods.generateAccessToken = function () {
    // short lived access token
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname,
            role: this.role // Include role in JWT
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}
userSchema.methods.generateRefreshToken = function () {
    // long lived access token
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}

userSchema.methods.generateEmailVerificationToken = function () {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    this.emailVerificationToken = verificationCode;
    this.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return verificationCode;
}

export const User = mongoose.model("User", userSchema);