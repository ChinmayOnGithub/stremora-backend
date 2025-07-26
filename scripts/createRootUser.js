// scripts/createRootUser.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.models.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: join(__dirname, '../.env') });

async function createRootAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in .env file!");
      process.exit(1);
    }
    console.log("Connecting to MongoDB:", process.env.MONGODB_URI);
    await mongoose.connect(`${process.env.MONGODB_URI}/vidtube`);
    console.log("✅ Connected to MongoDB");
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("⚠️ Root admin already exists. Skipping creation.");
      process.exit(0);
    }
    const admin = new User({
      username: "admin",
      email: "admin@stremora.com",
      fullname: "Root Admin",
      password: "admin@123",
      role: "admin"
    });
    console.log("Saving admin:", admin);
    try {
      await admin.save();
      console.log("✅ Root admin created");
    } catch (saveErr) {
      console.error("❌ Error saving admin:", saveErr);
      if (saveErr.errors) {
        for (const [field, err] of Object.entries(saveErr.errors)) {
          console.error(`Field: ${field}, Error: ${err.message}`);
        }
      }
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create root admin:", err);
    process.exit(1);
  }
}

createRootAdmin();
