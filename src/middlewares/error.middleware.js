import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500;
        const message = error.message || "Something went wrong!";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    // Enhanced logging
    console.error("\x1b[31m", `[${new Date().toISOString()}] ERROR:`, {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    }
    return res.status(error.statusCode).json(response);
}


export { errorHandler };

