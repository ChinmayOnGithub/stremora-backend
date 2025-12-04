import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with explicit credentials
// NOTE: secure: true is REQUIRED for signed uploads to work properly
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // CRITICAL: Required for signed uploads
});

// Debug: Verify configuration
const config = cloudinary.config();
console.log('[CLOUDINARY] Configuration loaded:', {
    cloud_name: config.cloud_name,
    api_key: config.api_key ? '***SET***' : 'NOT SET',
    api_secret: config.api_secret ? '***SET***' : 'NOT SET'
});

// Helper: Validate mimetype
export function isVideoMimetype(mimetype) {
    return mimetype && mimetype.startsWith("video/");
}

// Upload file to Cloudinary (handles both images and videos)
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Reconfigure on every upload to ensure credentials are fresh
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true // CRITICAL: Required for signed uploads
        });

        const cfg = cloudinary.config();
        console.log('[CLOUDINARY] Upload attempt:', {
            cloud_name: cfg.cloud_name,
            has_api_key: !!cfg.api_key,
            has_api_secret: !!cfg.api_secret,
            secure: cfg.secure,
            file: localFilePath
        });

        // Determine resource type
        const isVideo = localFilePath.match(/\.(mp4|mov|avi|mkv|webm)$/i);
        const resourceType = isVideo ? "video" : "auto";
        
        console.log(`[CLOUDINARY] Uploading as resource_type: ${resourceType}`);
        
        // Try using the default ml_default preset (already exists in your account)
        const uploadOptions = {
            resource_type: resourceType,
            upload_preset: "ml_default", // Use Cloudinary's default preset
            folder: "stremora"
        };
        
        console.log('[CLOUDINARY] Using ml_default preset');
        
        const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);

        console.log('[CLOUDINARY] ✅ Upload successful:', response.public_id);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("[CLOUDINARY] ❌ Upload failed:", error.message);
        if (error.error) {
            console.error("[CLOUDINARY] Error details:", error.error);
        }
        // DON'T delete file - let S3 fallback use it
        return null;
    }
};

// Delete file from Cloudinary (handles both images and videos)
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error.message);
        return null;
    }
};

export default cloudinary;
export { uploadOnCloudinary, deleteFromCloudinary };
