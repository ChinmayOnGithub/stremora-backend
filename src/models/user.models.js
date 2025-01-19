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
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudanary URL
            required: true,
        },
        coverImage: {
            type: String, //cloudanary URL
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
    },
    { timestamps: true } // createdAt and updatedAt is added here
)

// HOOKS
// lets use the pre hook from the mongoose middlewares.
userSchema.pre("save", async function (next) { // next is compulsary here.

    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
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
            fullname: this.fullname
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

export const User = mongoose.model("User", userSchema);