// Hybrid storage utility - tries Cloudinary first, falls back to S3
// TODO: S3 fallback is ready but needs AWS setup. See TODO_S3_IMPLEMENTATION.md
// To activate: Install @aws-sdk/client-s3 and add AWS credentials to .env
import { uploadOnCloudinary, deleteFromCloudinary } from "./cloudinary.js";
import { uploadOnS3, deleteFromS3 } from "./s3.js";

export function isVideoMimetype(mimetype) {
    return mimetype && mimetype.startsWith("video/");
}

/**
 * Upload file with fallback strategy
 * 1. Try Cloudinary first (free tier)
 * 2. If Cloudinary fails, use S3 as fallback
 * 
 * @param {string} localFilePath - Path to local file
 * @param {string} mimetype - File mimetype (optional)
 * @returns {Promise<Object|null>} Upload response with storage_provider field
 */
const uploadWithFallback = async (localFilePath, mimetype = "") => {
    try {
        console.log("📤 [Storage] Attempting Cloudinary upload first...");

        // Try Cloudinary first
        const cloudinaryResult = await uploadOnCloudinary(localFilePath);

        if (cloudinaryResult && cloudinaryResult.public_id) {
            console.log("✅ [Storage] Cloudinary upload successful!");
            return {
                ...cloudinaryResult,
                storage_provider: "cloudinary" // Mark which provider was used
            };
        }

        // If Cloudinary returns null, try S3
        console.log("⚠️ [Storage] Cloudinary failed, trying S3 fallback...");
        const s3Result = await uploadOnS3(localFilePath, mimetype);

        if (s3Result && s3Result.public_id) {
            console.log("✅ [Storage] S3 fallback successful!");
            return {
                ...s3Result,
                storage_provider: "s3" // Mark which provider was used
            };
        }

        console.error("❌ [Storage] Both Cloudinary and S3 failed");
        return null;

    } catch (error) {
        console.error("❌ [Storage] Upload error:", error.message);

        // Last resort: try S3 if Cloudinary threw an error
        try {
            console.log("⚠️ [Storage] Cloudinary error, trying S3 fallback...");
            const s3Result = await uploadOnS3(localFilePath, mimetype);

            if (s3Result && s3Result.public_id) {
                console.log("✅ [Storage] S3 fallback successful!");
                return {
                    ...s3Result,
                    storage_provider: "s3"
                };
            }
        } catch (s3Error) {
            console.error("❌ [Storage] S3 fallback also failed:", s3Error.message);
        }

        return null;
    }
};

/**
 * Delete file from appropriate storage provider
 * 
 * @param {string} publicId - File public ID
 * @param {string} storageProvider - "cloudinary" or "s3"
 * @param {string} resourceType - "image" or "video"
 * @returns {Promise<Object|null>} Delete response
 */
const deleteFromStorage = async (publicId, storageProvider = "cloudinary", resourceType = "image") => {
    try {
        if (!publicId) {
            console.log("⚠️ [Storage] No public_id provided for deletion");
            return null;
        }

        console.log(`🗑️ [Storage] Deleting from ${storageProvider}:`, publicId);

        if (storageProvider === "s3") {
            return await deleteFromS3(publicId);
        } else {
            // Default to Cloudinary
            return await deleteFromCloudinary(publicId, resourceType);
        }

    } catch (error) {
        console.error("❌ [Storage] Delete error:", error.message);
        return null;
    }
};

export { uploadWithFallback, deleteFromStorage };
