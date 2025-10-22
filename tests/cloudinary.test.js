import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary config:", cloudinary.config());

try {
  const res = await cloudinary.uploader.upload("./public/temp/test.mp4", {
    resource_type: "auto",
  });
  console.log("✅ Upload success:", res.secure_url);
} catch (err) {
  console.error("❌ Upload failed:", err.response?.body || err);
}