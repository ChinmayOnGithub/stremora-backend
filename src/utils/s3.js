// TODO: Install AWS SDK to use S3 fallback: bun add @aws-sdk/client-s3
// TODO: Add AWS credentials to .env (see TODO_S3_IMPLEMENTATION.md)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Configure AWS S3 Client (supports both real AWS S3 and local MinIO)
const s3Config = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
};

// If using local MinIO, add endpoint configuration
if (process.env.USE_LOCAL_S3 === "true" && process.env.LOCAL_S3_ENDPOINT) {
    s3Config.endpoint = process.env.LOCAL_S3_ENDPOINT;
    s3Config.forcePathStyle = true; // Required for MinIO
}

const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Helper: Validate mimetype
export function isVideoMimetype(mimetype) {
    return mimetype && mimetype.startsWith("video/");
}

// Upload file to S3 (handles videos, thumbnails, avatars, cover images)
const uploadOnS3 = async (localFilePath, mimetype = "video/mp4", fileType = "auto") => {
    try {
        if (!localFilePath) return null;

        // Extract video metadata BEFORE uploading (for videos only)
        let videoMetadata = null;
        if (mimetype && mimetype.startsWith("video/") && fileType === "videos") {
            try {
                const { getVideoMetadata } = await import("./videoMetadata.js");
                videoMetadata = await getVideoMetadata(localFilePath);
                console.log("[Video metadata extracted:", videoMetadata);
            } catch (error) {
                console.warn("[Could not extract video metadata:", error.message);
            }
        }

        // Read file
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = `${Date.now()}-${path.basename(localFilePath)}`;

        // Determine folder based on fileType or mimetype
        let folder = "videos";
        
        if (fileType !== "auto") {
            // Explicit file type provided
            folder = fileType; // e.g., "thumbnails", "avatars", "covers"
        } else if (mimetype && mimetype.startsWith("image/")) {
            // Auto-detect: generic images folder
            folder = "images";
        } else if (mimetype && mimetype.startsWith("video/")) {
            folder = "videos";
        }

        const key = `${folder}/${fileName}`;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: mimetype,
            // Note: ACL removed - use bucket policy instead for MinIO compatibility
        });

        await s3Client.send(command);

        // Construct public URL (different for local MinIO vs real AWS)
        let url;
        if (process.env.USE_LOCAL_S3 === "true" && process.env.LOCAL_S3_ENDPOINT) {
            // Local MinIO URL
            url = `${process.env.LOCAL_S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
        } else {
            // Real AWS S3 URL
            url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
        }

        // Clean up local file
        fs.unlinkSync(localFilePath);

        // Return response similar to Cloudinary format
        const response = {
            public_id: key,
            secure_url: url,
            url: url,
            resource_type: mimetype.startsWith("video/") ? "video" : "image",
            format: path.extname(fileName).substring(1),
        };

        // Add video metadata if available
        if (videoMetadata) {
            response.duration = videoMetadata.duration;
            response.width = videoMetadata.width;
            response.height = videoMetadata.height;
            response.bitrate = videoMetadata.bitrate;
            response.codec = videoMetadata.codec;
        }

        return response;
    } catch (error) {
        console.error("S3 upload error:", error.message);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Delete file from S3 (handles both images and videos)
const deleteFromS3 = async (publicId) => {
    try {
        if (!publicId) return null;

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: publicId, // publicId is the S3 key
        });

        await s3Client.send(command);
        return { result: "ok" };
    } catch (error) {
        console.error("S3 delete error:", error.message);
        return null;
    }
};

export { uploadOnS3, deleteFromS3 };
