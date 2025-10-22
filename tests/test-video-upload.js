// Test script for video upload functionality
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables first
dotenv.config({ path: './.env' });

console.log("🎬 Testing Video Upload Functionality...\n");

// Import after env is loaded
import { uploadOnCloudinary } from '../src/utils/cloudinary.js';

async function testVideoUpload() {
    // Get video file path from command line argument
    const videoPath = process.argv[2];

    if (!videoPath) {
        console.error("❌ Please provide a video file path:");
        console.error("Usage: node test-video-upload.js /path/to/your/video.mp4");
        process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
        console.error(`❌ File not found: ${videoPath}`);
        process.exit(1);
    }

    // Get file info
    const stats = fs.statSync(videoPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const fileName = path.basename(videoPath);

    console.log("📁 File Information:");
    console.log("- Name:", fileName);
    console.log("- Size:", fileSizeMB, "MB");
    console.log("- Path:", videoPath);
    console.log("");

    try {
        console.log("🚀 Starting upload test...");

        // Test the upload
        const result = await uploadOnCloudinary(videoPath, "video/mp4");

        console.log("🎉 Upload test successful!");
        console.log("📊 Upload Results:");
        console.log("- URL:", result.secure_url);
        console.log("- Public ID:", result.public_id);
        console.log("- Resource Type:", result.resource_type);
        console.log("- Format:", result.format);
        if (result.duration) {
            console.log("- Duration:", result.duration, "seconds");
        }
        if (result.width && result.height) {
            console.log("- Dimensions:", `${result.width}x${result.height}`);
        }

        console.log("\n✅ Your Cloudinary upload is working correctly!");
        console.log("You can now use the publishVideo endpoint in your application.");

    } catch (error) {
        console.error("❌ Upload test failed!");
        console.error("Error:", error.message);

        console.log("\n🔍 Troubleshooting Tips:");
        console.log("1. Check your .env file has correct Cloudinary credentials");
        console.log("2. Verify your Cloudinary account has video upload enabled");
        console.log("3. Check if your account has sufficient quota");
        console.log("4. Try with a smaller video file first");

        process.exit(1);
    }
}

testVideoUpload();