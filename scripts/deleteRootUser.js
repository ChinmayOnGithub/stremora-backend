import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.models.js";

dotenv.config();

async function deleteRootAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in .env file!");
      process.exit(1);
    }
    console.log("Connecting to MongoDB:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    const admins = await User.find({ role: "admin" });
    console.log("All admin users:", admins);
    if (admins.length === 0) {
      console.log("⚠️ No admin users found to delete.");
      process.exit(0);
    }
    const result = await User.deleteMany({ role: "admin" });
    console.log(`✅ Deleted ${result.deletedCount} admin user(s).`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to delete root admin:", err);
    process.exit(1);
  }
}

deleteRootAdmin(); 