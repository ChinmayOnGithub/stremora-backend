import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// using this now every req made contains _id of the user. hence now we know who the user is.
export const verifyJWT = asyncHandler(async (req, res, next) => { // Added 'res' for explicit error response
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            // If no token is provided, immediately send a 401 response.
            return res.status(401).json(new ApiError(401, "Unauthorized request"));
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            // This handles a valid token for a user that no longer exists.
            return res.status(401).json(new ApiError(401, "Invalid access token"));
        }

        // just like we extract information 
        // we can also set some information
        // This is all happening inside the middleware and yet to reach the server.
        req.user = user;

        // req.user is additional information now
        console.log("User verified successfully");
        console.log("Auth Middleware - Received Cookies:", req.cookies);

        // to transfer the flow control just say next()
        next();

    } catch (error) {
        // This is the critical fix. We now catch ALL errors and ensure a 401 is sent.
        // This guarantees the frontend interceptor will always receive the correct signal.
        const errorMessage = error.name === 'TokenExpiredError' ? "Access token expired" : "Invalid access token";
        return res.status(401).json(new ApiError(401, errorMessage));
    }
});
