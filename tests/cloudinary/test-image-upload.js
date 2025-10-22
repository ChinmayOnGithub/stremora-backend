// Test image upload specifically
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

console.log("🖼️ Testing Image Upload Specifically...\n");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("🔧 Cloudinary config:", {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key ? "✅ Set" : "❌ Missing",
    api_secret: cloudinary.config().api_secret ? "✅ Set" : "❌ Missing"
});

async function testImageUpload() {
    // Create a simple test image file (actually just a text file)
    const testImagePath = path.join(__dirname, '../../test-image.txt');
    const testContent = 'This is a test image file - ' + new Date().toISOString();
    
    try {
        console.log("📝 Creating test image file...");
        fs.writeFileSync(testImagePath, testContent);
        
        console.log("📤 Testing image upload...");
        
        // Test 1: Basic upload
        try {
            console.log("🔄 Test 1: Basic upload...");
            const result1 = await cloudinary.uploader.upload(testImagePath, {
                resource_type: "image"
            });
            console.log("✅ Test 1 SUCCESS:", result1.secure_url);
        } catch (error1) {
            console.error("❌ Test 1 FAILED:", error1.message);
        }

        // Test 2: Upload with folder
        try {
            console.log("🔄 Test 2: Upload with folder...");
            const result2 = await cloudinary.uploader.upload(testImagePath, {
                resource_type: "image",
                folder: "stremora/images"
            });
            console.log("✅ Test 2 SUCCESS:", result2.secure_url);
        } catch (error2) {
            console.error("❌ Test 2 FAILED:", error2.message);
        }

        // Test 3: Upload with auto resource type
        try {
            console.log("🔄 Test 3: Upload with auto resource type...");
            const result3 = await cloudinary.uploader.upload(testImagePath, {
                resource_type: "auto",
                folder: "stremora/images"
            });
            console.log("✅ Test 3 SUCCESS:", result3.secure_url);
        } catch (error3) {
            console.error("❌ Test 3 FAILED:", error3.message);
        }

        // Clean up test file
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        
    } catch (error) {
        console.error("❌ Test setup failed:", error.message);
        
        // Clean up test file
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    }
}

testImageUpload();