// Test thumbnail upload specifically
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { uploadOnCloudinary } from '../src/utils/cloudinary.js';
import fs from 'fs';

console.log("🖼️ Testing Thumbnail Upload...\n");

async function testThumbnailUpload() {
    // Create a simple test image file
    const testImagePath = './test-thumbnail.txt';
    const testContent = 'This is a test thumbnail file - ' + new Date().toISOString();

    try {
        console.log("📝 Creating test image file...");
        fs.writeFileSync(testImagePath, testContent);

        console.log("📤 Testing thumbnail upload with image mimetype...");
        const result = await uploadOnCloudinary(testImagePath, "image/jpeg");

        console.log("🎉 Thumbnail upload successful!");
        console.log("📊 Upload Results:");
        console.log("- URL:", result.secure_url);
        console.log("- Public ID:", result.public_id);
        console.log("- Resource Type:", result.resource_type);

        // Check if it went to the images folder
        if (result.public_id.includes('stremora/images/')) {
            console.log("✅ File correctly uploaded to images folder!");
        } else {
            console.log("⚠️ File uploaded to:", result.public_id);
        }

        // Clean up test file
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }

        console.log("\n✅ Thumbnail upload test PASSED!");

    } catch (error) {
        console.error("❌ Thumbnail upload test FAILED!");
        console.error("Error:", error.message);

        // Clean up test file
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }

        process.exit(1);
    }
}

testThumbnailUpload();