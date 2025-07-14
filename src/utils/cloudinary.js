import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config();

// Config assertion for Cloudinary env vars
console.assert(process.env.CLOUDINARY_CLOUD_NAME, "Missing Cloudinary CLOUD_NAME");
console.assert(process.env.CLOUDINARY_API_KEY, "Missing Cloudinary API_KEY");
console.assert(process.env.CLOUDINARY_API_SECRET, "Missing Cloudinary API_SECRET");

// configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("[Cloudinary] Config after setup:", cloudinary.config());

export default cloudinary;

// Helper: Validate mimetype
export function isVideoMimetype(mimetype) {
    return mimetype && mimetype.startsWith("video/");
}

// Robust upload function with timeout and error handling
// Now detects file type and sets resource_type/folder accordingly
const uploadOnCloudinary = async (localFilePath, mimetype = "", options = {}) => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            throw new Error("File does not exist: " + localFilePath);
        }
        // Detect file type
        let resource_type = "raw";
        let folder = "others";
        if (mimetype.startsWith("image/")) {
            resource_type = "image";
            folder = "images";
        } else if (mimetype.startsWith("video/")) {
            resource_type = "video";
            folder = "videos";
        } else if (mimetype === "application/pdf" || localFilePath.endsWith(".pdf")) {
            resource_type = "raw";
            folder = "pdfs";
        }
        // Always public
        const uploadOptions = {
            resource_type,
            folder,
            access_mode: "public",
            ...options
        };
        console.log("[Cloudinary] Upload options:", uploadOptions);
        const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.log("Error on Cloudinary", error);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary = async (identifier) => {
    try {
        // Extract publicId if the identifier is a full URL
        let publicId = identifier;
        if (identifier.startsWith("http")) {
            const parts = identifier.split("/");
            const publicIdWithExtension = parts[parts.length - 1]; // e.g., "jy68d0ndnmmktxh3rvan.jpg"
            publicId = publicIdWithExtension.split(".")[0]; // Remove the file extension
        }
        // File could be at any location
        console.log("attempting to delete the image: ", publicId);
        // Attempt to delete from videos folder
        const resultVideo = await cloudinary.uploader.destroy(`videos/${publicId}`, { resource_type: "video" });
        console.log("Deleted from cloudinary videos. publicId: ", publicId);
        // Attempt to delete from thumbnails folder
        const resultThumbnail = await cloudinary.uploader.destroy(`thumbnail/${publicId}`);
        console.log("Deleted from cloudinary thumbnails. publicId: ", publicId);
        // Attempt to delete from root folder
        const resultRoot = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from cloudinary root. publicId: ", publicId);
        return { resultThumbnail, resultVideo, resultRoot };
    } catch (error) {
        console.log("Error deleting from cloudinary", error);
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };