import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

import dotenv from 'dotenv';

dotenv.config()
// console.log("Cloudinary Config:", process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);



// confifure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


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

        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto",
            folder: folder
        });
        console.log("File uploaded on cloudinary. File src: ", response.url);
        // once the file is uploaded, we want to delete it from our server.
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        console.log("Error on Cloudinary", error);

        fs.unlinkSync(localFilePath);
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