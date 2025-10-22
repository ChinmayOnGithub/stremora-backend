// Test video upload functionality
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import the actual upload function
import { uploadOnCloudinary } from '../../src/utils/cloudinary.js';

console.log("🎬 Testing Video Upload Functionality...\n");

async function testVideoUpload() {
    try {
        console.log("🔍 Environment check:");
        console.log("- CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing");
        console.log("- CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");
        console.log("- CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");
        console.log("");

        // Create a test file to simulate video upload
        const testVideoPath = path.join(__dirname, '../../test-video.txt');
        const testContent = 'This is a test video file - ' + new Date().toISOString();
        
        console.log("📝 Creating test video file...");
        const fs = await import('fs');
        fs.writeFileSync(testVideoPath, testContent);
        
        console.log("📤 Testing video upload with uploadOnCloudinary function...");
        
        try {
            const result = await uploadOnCloudinary(testVideoPath, "video/mp4");
            
            if (result) {
                console.log("✅ Video upload test SUCCESS!");
                console.log("- URL:", result.secure_url);
                console.log("- Public ID:", result.public_id);
                console.log("- Resource Type:", result.resource_type);
                if (result.duration) {
                    console.log("- Duration:", result.duration, "seconds");
                }
            } else {
                console.log("❌ Video upload test FAILED - no result returned");
            }
        } catch (uploadError) {
            console.error("❌ Video upload test FAILED:", uploadError.message);
            console.error("Full error:", uploadError);
        }
        
        // Clean up test file if it still exists
        if (fs.existsSync(testVideoPath)) {
            fs.unlinkSync(testVideoPath);
            console.log("🗑️ Test file cleaned up");
        }
        
    } catch (error) {
        console.error("❌ Test setup failed:", error.message);
    }
}

testVideoUpload();