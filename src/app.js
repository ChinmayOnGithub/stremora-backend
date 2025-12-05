import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.1.9:5173",
    "https://stremora.vercel.app",
    "https://stremora.chinmaypatil.com",
    "https://www.stremora.chinmaypatil.com" // Add www version too
]

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin || allowedOrigins.includes(origin)) {
            cb(null, true);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            cb(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Total-Count"],
    maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options("*", cors());

// app.use(
//     // cors is middleware that decide who can access our server
//     cors({
//         origin: process.env.CORS_ORIGIN,
//         credentials: true
//     })
// )

// common middlewares
// import requestLogger from "./utils/requestLogger.js";
import logMiddleware from "./middlewares/log.middleware.js";
import passport from "passport";
import session from "express-session";

// Session configuration for passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// app.use(express.json({ limit: "16kb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser())
app.use(express.static("public"));
// app.use(requestLogger);
app.use(logMiddleware);

// import routes
import healthCheckRouter from './routes/healthcheck.routes.js';
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import historyRouter from "./routes/history.routes.js"
import adminRouter from "./routes/admin.routes.js";
import emailVerificationRouter from "./routes/emailverification.routes.js";
import authRouter from "./routes/auth.routes.js";

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
app.use("/api/v1/email", emailVerificationRouter);
app.use("/api/v1/auth", authRouter);

// good practice to have control over the errors. (Optional) This error.middleware.js file changes rarely.
import { errorHandler } from "./middlewares/error.middleware.js";



app.use(errorHandler);


export { app }