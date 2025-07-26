import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    try {
        let error = err;

        // Debug logging
        console.log("Error caught:", {
            path: req?.path,
            method: req?.method,
            message: err?.message,
            stack: err?.stack,
            resType: typeof res,
            resStatusType: typeof res?.status
        });

        // Skip if res is not a proper Express response
        if (!res || typeof res.status !== "function") {
            console.error("Invalid response object in error handler");
            return next(err);
        }

        if (!(error instanceof ApiError)) {
            const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500;
            const message = error.message || "Something went wrong!";
            error = new ApiError(statusCode, message, error?.errors || [], err.stack);
        }

        // Enhanced logging
        console.error("\x1b[31m", `[${new Date().toISOString()}] ERROR:`, {
            path: req?.path,
            method: req?.method,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        const response = {
            success: false,
            statusCode: error.statusCode,
            message: error.message,
            ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
            ...(error.errors?.length ? { errors: error.errors } : {})
        }

        return res.status(error.statusCode).json(response);
    } catch (e) {
        console.error("Unhandled error in error middleware:", e);
        return res.status(500).json({
            success: false,
            message: "Internal server error in error handler"
        });
    }
}

export { errorHandler };

