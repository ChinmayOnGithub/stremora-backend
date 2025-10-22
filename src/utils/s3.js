// TODO: Install AWS SDK to use S3 fallback: bun add @aws-sdk/client-s3
// TODO: Add AWS credentials to .env (see TODO_S3_IMPLEMENTATION.md)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Helper: Validate mimetype
export function isVideoMimetype(mimetype) {
    return mimetype && mimetype.startsWith("video/");
}

// Upload file to S3 (handles both images and videos)
const uploadOnS3 = async (localFilePath, mimetype = "video/mp4") => {
    try {
        if (!localFilePath) return null;

        // Read file
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = `${Date.now()}-${path.basename(localFilePath)}`;

        // Determine folder based on mimetype
        let folder = "videos";
        if (mimetype && mimetype.startsWith("image/")) {
            folder = "images";
        }

        const key = `${folder}/${fileName}`;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: mimetype,
            ACL: "public-read", // Make file publicly accessible
        });

        await s3Client.send(command);

        // Construct public URL
        const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

        // Clean up local file
        fs.unlinkSync(localFilePath);

        // Return response similar to Cloudinary format
        return {
            public_id: key,
            secure_url: url,
            url: url,
            resource_type: mimetype.startsWith("video/") ? "video" : "image",
            format: path.extname(fileName).substring(1),
        };
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
