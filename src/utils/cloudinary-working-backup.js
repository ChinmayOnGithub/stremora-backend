import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config();

// This configuration is correct and loads your credentials.
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

// This is the new, robust upload function that correctly handles signed uploads with folders.
const uploadOnCloudinary = async (localFilePath, mimetype = "") => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            throw new Error("File does not exist: " + localFilePath);
        }

        // Detect file type to determine the correct folder
        // let folder = "stremora/others"; // A default folder
        // if (mimetype.startsWith("image/")) {
        //     folder = "stremora/images";
        // } else if (mimetype.startsWith("video/")) {
        //     folder = "stremora/videos";
        // }

        // By only providing resource_type and folder, the SDK will perform a secure, signed upload.
        // We are no longer passing the problematic 'access_mode' or other options.
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            // folder,
        });

        // console.log(`File uploaded successfully to Cloudinary folder '${folder}':`, response.url);
        console.log(`File uploaded successfully to Cloudinary folder:`, response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.error("Error on Cloudinary Upload:", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

// Your delete function is preserved.
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) {
            console.log("No public_id provided for deletion.");
            return null;
        }

        console.log(`Attempting to delete from Cloudinary. Public ID: ${publicId}, Type: ${resourceType}`);

        // Use the correct resource_type for deletion
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        console.log("Deletion result from Cloudinary:", result);

        // A successful result looks like: { result: 'ok' }
        if (result.result !== 'ok') {
            console.warn(`Cloudinary deletion failed for ${publicId}:`, result);
        }

        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };