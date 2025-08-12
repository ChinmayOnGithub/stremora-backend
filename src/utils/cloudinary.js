// // import { v2 as cloudinary } from 'cloudinary';
// // import fs from "fs";
// // import dotenv from 'dotenv';

// // dotenv.config();

// // // Config assertion for Cloudinary env vars
// // console.assert(process.env.CLOUDINARY_CLOUD_NAME, "Missing Cloudinary CLOUD_NAME");
// // console.assert(process.env.CLOUDINARY_API_KEY, "Missing Cloudinary API_KEY");
// // console.assert(process.env.CLOUDINARY_API_SECRET, "Missing Cloudinary API_SECRET");

// // // configure cloudinary
// // cloudinary.config({
// //     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// //     api_key: process.env.CLOUDINARY_API_KEY,
// //     api_secret: process.env.CLOUDINARY_API_SECRET
// // });
// // console.log("[Cloudinary] Config after setup:", cloudinary.config());

// // // This export is now restored to fix the error.
// // export default cloudinary;

// // // Helper: Validate mimetype
// // export function isVideoMimetype(mimetype) {
// //     return mimetype && mimetype.startsWith("video/");
// // }

// // // Robust upload function with folder logic restored
// // const uploadOnCloudinary = async (localFilePath, mimetype = "") => {
// //     try {
// //         if (!localFilePath || !fs.existsSync(localFilePath)) {
// //             throw new Error("File does not exist: " + localFilePath);
// //         }

// //         // Detect file type to determine the correct folder
// //         let resource_type = "auto";
// //         let folder = "stremora/others"; // A default folder
// //         if (mimetype.startsWith("image/")) {
// //             folder = "stremora/images";
// //         } else if (mimetype.startsWith("video/")) {
// //             folder = "stremora/videos";
// //         }

// //         const response = await cloudinary.uploader.upload(localFilePath, {
// //             resource_type,
// //             folder, // Specify the folder for the upload
// //         });

// //         console.log(`File uploaded successfully to Cloudinary folder '${folder}':`, response.url);
// //         fs.unlinkSync(localFilePath);
// //         return response;

// //     } catch (error) {
// //         console.error("Error on Cloudinary Upload:", error);
// //         if (fs.existsSync(localFilePath)) {
// //             fs.unlinkSync(localFilePath);
// //         }
// //         return null;
// //     }
// // }


// // // Robust upload function that now correctly performs a SIGNED upload.
// // // const uploadOnCloudinary = async (localFilePath) => {
// // //     try {
// // //         if (!localFilePath || !fs.existsSync(localFilePath)) {
// // //             throw new Error("File does not exist: " + localFilePath);
// // //         }

// // //         // By not providing an 'upload_preset', the Cloudinary SDK automatically
// // //         // uses your API keys to create a secure, signed upload request.
// // //         const response = await cloudinary.uploader.upload(localFilePath, {
// // //             resource_type: "auto", // Automatically detect if it's an image, video, or raw file
// // //         });

// // //         // The old, insecure unsigned upload logic is commented out for reference.
// // //         /*
// // //         let resource_type = "raw";
// // //         let folder = "others";
// // //         if (mimetype.startsWith("image/")) {
// // //             resource_type = "image";
// // //             folder = "images";
// // //         } else if (mimetype.startsWith("video/")) {
// // //             resource_type = "video";
// // //             folder = "videos";
// // //         }
// // //         const uploadOptions = {
// // //             resource_type,
// // //             folder,
// // //             access_mode: "public",
// // //             ...options
// // //         };
// // //         console.log("[Cloudinary] Upload options:", uploadOptions);
// // //         const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);
// // //         */

// // //         console.log("File uploaded successfully to Cloudinary:", response.url);
// // //         fs.unlinkSync(localFilePath); // Clean up the temporary file from the server
// // //         return response;

// // //     } catch (error) {
// // //         console.error("Error on Cloudinary Upload:", error);
// // //         if (fs.existsSync(localFilePath)) {
// // //             fs.unlinkSync(localFilePath); // Clean up the temporary file even on failure
// // //         }
// // //         return null;
// // //     }
// // // }

// // // Your delete function is well-written and preserved.
// // const deleteFromCloudinary = async (identifier) => {
// //     try {
// //         let publicId = identifier;
// //         if (identifier.startsWith("http")) {
// //             const parts = identifier.split("/");
// //             // Correctly extract the public ID, which includes the folder path
// //             // Example: "http://.../upload/v123/videos/my_video_id.mp4" -> "videos/my_video_id"
// //             const folderIndex = parts.indexOf('upload') + 2;
// //             const publicIdWithExtension = parts.slice(folderIndex).join('/');
// //             publicId = publicIdWithExtension.split(".")[0];
// //         }

// //         console.log("Attempting to delete from Cloudinary. Public ID:", publicId);

// //         // To delete any resource, you need to specify its resource_type
// //         const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
// //         console.log("Deletion result from Cloudinary:", result);

// //         return result;
// //     } catch (error) {
// //         console.log("Error deleting from Cloudinary", error);
// //         return null;
// //     }
// // }

// // export { uploadOnCloudinary, deleteFromCloudinary };


// import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs";
// import dotenv from 'dotenv';

// dotenv.config();

// // Config assertion for Cloudinary env vars
// console.assert(process.env.CLOUDINARY_CLOUD_NAME, "Missing Cloudinary CLOUD_NAME");
// console.assert(process.env.CLOUDINARY_API_KEY, "Missing Cloudinary API_KEY");
// console.assert(process.env.CLOUDINARY_API_SECRET, "Missing Cloudinary API_SECRET");

// // configure cloudinary
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });
// console.log("[Cloudinary] Config after setup:", cloudinary.config());

// export default cloudinary;

// // Helper: Validate mimetype
// export function isVideoMimetype(mimetype) {
//     return mimetype && mimetype.startsWith("video/");
// }

// // This is the new, robust upload function that correctly handles signed uploads with folders.
// const uploadOnCloudinary = async (localFilePath, mimetype = "") => {
//     try {
//         if (!localFilePath || !fs.existsSync(localFilePath)) {
//             throw new Error("File does not exist: " + localFilePath);
//         }

//         // Detect file type to determine the correct folder
//         let folder = "stremora/others"; // A default folder
//         if (mimetype.startsWith("image/")) {
//             folder = "stremora/images";
//         } else if (mimetype.startsWith("video/")) {
//             folder = "stremora/videos";
//         }

//         // By only providing resource_type and folder, the SDK will perform a secure, signed upload.
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto",
//             folder,
//         });

//         console.log(`File uploaded successfully to Cloudinary folder '${folder}':`, response.url);
//         fs.unlinkSync(localFilePath);
//         return response;

//     } catch (error) {
//         console.error("Error on Cloudinary Upload:", error);
//         if (fs.existsSync(localFilePath)) {
//             fs.unlinkSync(localFilePath);
//         }
//         return null;
//     }
// }

// // Your delete function is preserved and slightly improved for robustness.
// const deleteFromCloudinary = async (identifier) => {
//     try {
//         let publicId = identifier;
//         if (identifier.startsWith("http")) {
//             const parts = identifier.split("/");
//             const publicIdWithExtension = parts.slice(parts.indexOf('upload') + 2).join('/');
//             publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
//         }

//         console.log("Attempting to delete from Cloudinary. Public ID:", publicId);
//         const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
//         console.log("Deletion result from Cloudinary:", result);
//         return result;
//     } catch (error) {
//         console.log("Error deleting from Cloudinary", error);
//         return null;
//     }
// }

// export { uploadOnCloudinary, deleteFromCloudinary };


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
        let folder = "stremora/others"; // A default folder
        if (mimetype.startsWith("image/")) {
            folder = "stremora/images";
        } else if (mimetype.startsWith("video/")) {
            folder = "stremora/videos";
        }

        // By only providing resource_type and folder, the SDK will perform a secure, signed upload.
        // We are no longer passing the problematic 'access_mode' or other options.
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder,
        });

        console.log(`File uploaded successfully to Cloudinary folder '${folder}':`, response.url);
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
const deleteFromCloudinary = async (identifier) => {
    try {
        let publicId = identifier;
        if (identifier.startsWith("http")) {
            const parts = identifier.split("/");
            const publicIdWithExtension = parts.slice(parts.indexOf('upload') + 2).join('/');
            publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
        }

        console.log("Attempting to delete from Cloudinary. Public ID:", publicId);
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
        console.log("Deletion result from Cloudinary:", result);
        return result;
    } catch (error) {
        console.log("Error deleting from Cloudinary", error);
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };
