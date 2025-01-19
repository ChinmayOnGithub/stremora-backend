import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';


// using this now every req made contains _id of the user. hence now we know who the user is.
export const verifyJWT = asyncHandler(async (req, _, next) => {

    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Unauthorized");
        }

        // just like we extract information 
        // we can also set some information
        // This is all happening inside the middleware and yet to reach the server.
        req.user = user;
        console.log("User verified successfully");

        // req.user is additional information now

        // to transfer the flow control just say next()
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }

})

