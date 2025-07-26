import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://192.168.1.9:5173", "https://stremora.vercel.app", "https://stremora.chinmaypatil.com"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));


// app.use(
//     // cors is middleware that decide who can access our server
//     cors({
//         origin: process.env.CORS_ORIGIN,
//         credentials: true
//     })
// )

// common middlewares
// app.use(express.json({ limit: "16kb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser())
app.use(express.static("public"));

// import routes
import healthCheckRouter from './routes/healthcheck.routes.js';
import userRouter from "../src/routes/user.routes.js";
import videoRouter from "../src/routes/video.routes.js";
import likeRouter from "../src/routes/like.routes.js";
import tweetRouter from "../src/routes/tweet.routes.js";
import commentRouter from "../src/routes/comment.routes.js"
import playlistRouter from "../src/routes/playlist.routes.js"
import subscriptionRouter from "../src/routes/subscription.routes.js"
import dashboardRouter from "../src/routes/dashboard.routes.js"
import historyRouter from "../src/routes/history.routes.js"
import adminRouter from "../src/routes/admin.routes.js";

// routes
app.use('/api/v1/health', healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/history", historyRouter);
app.use("/api/v1/admin", adminRouter);

// Serve static files before error middleware
app.use('/public', express.static("public", {
    fallthrough: true, // Continue to next middleware if file not found
    index: false // Disable serving index.html for directories
}));

// Catch-all route for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path
    });
});

// Error middleware should be last
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export { app }