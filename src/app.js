import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { upload } from "./middlewares/multer.middleware.js";


const app = express();

app.use(
    // cors is middleware that decide who can access our server
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

// common middlewares
// app.use(express.json({ limit: "16kb" }));
app.use(express.json());
app.use(express.urlencoded({ extende: true, limit: "16kb" }));
app.use(cookieParser())
app.use(express.static("public"));

// import routes
import healthcheckRouter from "../src/routes/healthcheck.routes.js";
import userRouter from "../src/routes/user.routes.js";
import videoRouter from "../src/routes/video.routes.js";
import likeRouter from "../src/routes/like.routes.js";
import tweetRouter from "../src/routes/tweet.routes.js";
import commentRouter from "../src/routes/comment.routes.js"
import playlistRouter from "../src/routes/playlist.routes.js"

// routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRouter);

// good practice to have control over the errors. (Optional) This error.middleware.js file changes rarely.
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);


export { app }