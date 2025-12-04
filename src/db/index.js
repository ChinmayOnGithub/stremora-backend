import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`[DATABASE] Connected to MongoDB`);
        console.log(`[DATABASE] Host: ${connectionInstance.connection.host}`);
        console.log(`[DATABASE] Database: ${DB_NAME}`);

    } catch (error) {
        console.error("[DATABASE] Connection failed:", error.message);
        process.exit(1);
    }
}


export default connectDB;