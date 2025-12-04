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
 * 1. Try S3 first (primary, reliable, cost-effective)
 * 2. If S3 fails, use Cloudinary as fallback
 * 
 * @param {string} localFilePath - Path to local file
 * @param {string} mimetype - File mimetype (optional)
 * @param {string} fileType - Folder type: "videos", "thumbnails", "avatars", "covers" (optional)
 * @returns {Promise<Object|null>} Upload response with storage_provider field
 */
const uploadWithFallback = async (localFilePath, mimetype = "", fileType = "auto") => {
    try {
        console.log(`[STORAGE] Attempting S3 upload (type: ${fileType})`);

        // Try S3 first (primary storage)
        const s3Result = await uploadOnS3(localFilePath, mimetype, fileType);

        if (s3Result && s3Result.public_id) {
            console.log("[[Storage] S3 upload successful!");
            return {
                ...s3Result,
                storage_provider: "s3"
            };
        }

        // If S3 fails, try Cloudinary as fallback
        console.log(`[STORAGE] S3 failed, attempting Cloudinary fallback (type: ${fileType})`);
        const cloudinaryResult = await uploadOnCloudinary(localFilePath);

        if (cloudinaryResult && cloudinaryResult.public_id) {
            console.log("[[Storage] Cloudinary fallback successful!");
            return {
                ...cloudinaryResult,
                storage_provider: "cloudinary"
            };
        }

        console.error("[[Storage] Both S3 and Cloudinary failed");
        return null;

    } catch (error) {
        console.error("[[Storage] Upload error:", error.message);

        // Last resort: try Cloudinary if S3 threw an error
        try {
            console.log(`[STORAGE] S3 error, attempting Cloudinary fallback (type: ${fileType})`);
            const cloudinaryResult = await uploadOnCloudinary(localFilePath);

            if (cloudinaryResult && cloudinaryResult.public_id) {
                console.log("[[Storage] Cloudinary fallback successful!");
                return {
                    ...cloudinaryResult,
                    storage_provider: "cloudinary"
                };
            }
        } catch (cloudinaryError) {
            console.error("[[Storage] Cloudinary fallback also failed:", cloudinaryError.message);
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
            console.log("[[Storage] No public_id provided for deletion");
            return null;
        }

        console.log(`[STORAGE] Deleting from ${storageProvider}:`, publicId);

        if (storageProvider === "s3") {
            return await deleteFromS3(publicId);
        } else {
            // Default to Cloudinary
            return await deleteFromCloudinary(publicId, resourceType);
        }

    } catch (error) {
        console.error("[[Storage] Delete error:", error.message);
        return null;
    }
};

export { uploadWithFallback, deleteFromStorage };
