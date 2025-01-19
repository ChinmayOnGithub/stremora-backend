import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`\nMongoDB connected! DB host : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1); // using exit code 1 because we are intenstionally crashing it 
    }
}


export default connectDB;