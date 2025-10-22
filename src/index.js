// CRITICAL: Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});

// Now import other modules after env is loaded
// Cloudinary will auto-configure when its utilities are first used
import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 8001;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection error", err);

    })