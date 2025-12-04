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
        const server = app.listen(PORT, () => {
            console.log(`[SERVER] Running on http://localhost:${PORT}`);
            console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`[SERVER] Port ${PORT} is already in use`);
                console.error(`[SERVER] Please stop the other process or change the PORT in .env`);
                process.exit(1);
            } else {
                console.error('[SERVER] Error starting server:', error.message);
                process.exit(1);
            }
        });
    })
    .catch((err) => {
        console.error("[DATABASE] MongoDB connection error:", err.message);
        process.exit(1);
    })