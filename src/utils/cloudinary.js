import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Validate mimetype
export function isVideoMimetype(mimetype) {
    return mimetype && mimetype.startsWith("video/");
}

// Upload file to Cloudinary (handles both images and videos)
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Only delete file on SUCCESS
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error.message);
        // DON'T delete file on error - let S3 fallback use it!
        // File will be cleaned up by S3 upload or controller cleanup
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
