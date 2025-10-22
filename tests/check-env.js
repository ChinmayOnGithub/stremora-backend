// Just check if we can read the .env file
import dotenv from 'dotenv';

console.log("🔍 Checking .env file...\n");

// Load .env
const result = dotenv.config({ path: './.env' });

if (result.error) {
    console.error("❌ Error loading .env:", result.error);
} else {
    console.log("✅ .env loaded successfully");
}

console.log("\n📋 Environment Variables:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "❌ NOT SET");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY || "❌ NOT SET");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ NOT SET");

console.log("\n🔍 All Cloudinary env vars:");
Object.keys(process.env)
    .filter(key => key.startsWith('CLOUDINARY'))
    .forEach(key => {
        console.log(`${key}:`, key.includes('SECRET') ? '***hidden***' : process.env[key]);
    });