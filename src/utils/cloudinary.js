import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

import dotenv from 'dotenv';

dotenv.config()
// console.log("Cloudinary Config:", process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);

// confifure cloudinary
cloudinary.config({
    cloud_name: "dvukrn3hn",
    api_key: "311746583244972",
    api_secret: "_o6c_9a4LTAUHy6EqJ-1_MqZ2SE"
});
console.log("[Cloudinary] Config after setup:", cloudinary.config());

export default cloudinary;

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Determine the folder based on file extension
        const fileExtension = localFilePath.split('.').pop();
        let folder = 'others';
        if (fileExtension === 'jpg' || fileExtension === 'png' || fileExtension === 'jpeg') {
            folder = 'thumbnail';
        } else if (fileExtension === 'mp4' || fileExtension === 'avi' || fileExtension === 'mkv' || fileExtension === 'webm') {
            folder = 'videos';
        }

        // Ensure the folder is always in the root directory
        folder = `/${folder}`;

        const uploadOptions = {
            resource_type: "auto",
            folder: folder
        };

        console.log("[Cloudinary] Upload options:", uploadOptions);
        console.log("[Cloudinary] File path:", localFilePath);
        console.log("[Cloudinary] File exists:", fs.existsSync(localFilePath));
        console.log("[Cloudinary] File size:", fs.statSync(localFilePath).size, "bytes");

        const response = await cloudinary.uploader.upload(
            localFilePath, uploadOptions
        );
        console.log("File uploaded on cloudinary. File src: ", response.url);
        // once the file is uploaded, we want to delete it from our server.
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        console.log("Error on Cloudinary", error);
        console.log("[Cloudinary] Error details:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name
        });

        // Only delete if file exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

const deleteFromCloudinary = async (identifier) => {
    try {

        // Normally i get the full url and not only public_id
        // so i need to split the url to get the public_id

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

export { uploadOnCloudinary, deleteFromCloudinary }