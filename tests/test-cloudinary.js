// Test script to verify Cloudinary configuration
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ path: './.env' });

console.log("🧪 Testing Cloudinary Configuration...\n");

// Check environment variables
console.log("📋 Environment Variables:");
console.log("- CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing");
console.log("- CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");  
console.log("- CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");
console.log("");

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ CRITICAL: Missing Cloudinary environment variables!");
    console.error("Please check your .env file and ensure all Cloudinary variables are set.");
    process.exit(1);
}

// Now import Cloudinary after env is loaded
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary manually in test
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test Cloudinary configuration
try {
    const config = cloudinary.config();
    console.log("✅ Cloudinary SDK Configuration:");
    console.log("- Cloud Name:", config.cloud_name);
    console.log("- API Key:", config.api_key ? "✅ Set" : "❌ Missing");
    console.log("- API Secret:", config.api_secret ? "✅ Set" : "❌ Missing");
    console.log("");
} catch (error) {
    console.error("❌ Cloudinary configuration failed:", error);
    process.exit(1);
}

// Test basic Cloudinary connection
async function testCloudinaryConnection() {
    try {
        console.log("🔗 Testing Cloudinary connection...");
        
        // Test with a simple API call
        const result = await cloudinary.api.ping();
        console.log("✅ Cloudinary connection successful:", result);
        return true;
    } catch (error) {
        console.error("❌ Cloudinary connection failed:");
        console.error("Error:", error.message);
        if (error.http_code) {
            console.error("HTTP Code:", error.http_code);
        }
        return false;
    }
}

// Test file upload (if test file exists)
async function testFileUpload() {
    // Create a simple test file
    const testFilePath = './test-upload.txt';
    const testContent = 'This is a test file for Cloudinary upload - ' + new Date().toISOString();
    
    try {
        console.log("📝 Creating test file...");
        fs.writeFileSync(testFilePath, testContent);
        
        console.log("📤 Testing file upload...");
        const uploadResult = await cloudinary.uploader.upload(testFilePath, {
            resource_type: 'raw',
            public_id: 'stremora_test_' + Date.now()
        });
        
        console.log("✅ Upload successful!");
        console.log("- URL:", uploadResult.secure_url);
        console.log("- Public ID:", uploadResult.public_id);
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        
        // Clean up uploaded file
        await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'raw' });
        console.log("🗑️ Test file cleaned up from Cloudinary");
        
        return true;
    } catch (error) {
        console.error("❌ Upload test failed:");
        console.error("Error:", error.message);
        if (error.error) {
            console.error("Cloudinary error:", error.error);
        }
        
        // Clean up test file if it exists
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log("🚀 Starting Cloudinary Tests...\n");
    
    const connectionTest = await testCloudinaryConnection();
    console.log("");
    
    if (connectionTest) {
        const uploadTest = await testFileUpload();
        console.log("");
        
        if (uploadTest) {
            console.log("🎉 ALL TESTS PASSED! Cloudinary is working correctly.");
            console.log("You can now try uploading videos through your application.");
        } else {
            console.log("❌ Upload test failed. Check your Cloudinary account settings.");
            console.log("Make sure your account has upload permissions enabled.");
        }
    } else {
        console.log("❌ Connection test failed. Check your credentials and network connection.");
    }
}

runTests().catch(console.error);