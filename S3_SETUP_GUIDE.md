# AWS S3 Setup Guide for Video Storage

## Why S3 over Cloudinary?
- More reliable for large video files
- Cheaper for storage and bandwidth
- More control over your files
- No upload preset issues
- Better for production applications

## Step 1: Install AWS SDK

```bash
bun add @aws-sdk/client-s3
```

## Step 2: Create AWS Account & S3 Bucket

1. Go to https://aws.amazon.com/ and create an account (free tier available)
2. Go to S3 service in AWS Console
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., `stremora-videos`)
5. Select your region (e.g., `us-east-1`)
6. **Uncheck "Block all public access"** (we need public access for video streaming)
7. Click "Create bucket"

## Step 3: Configure Bucket Permissions

1. Go to your bucket → Permissions tab
2. Edit "Bucket policy" and add:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

## Step 4: Create IAM User & Get Credentials

1. Go to IAM service in AWS Console
2. Click "Users" → "Add users"
3. Username: `stremora-uploader`
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: `AmazonS3FullAccess`
8. Click through to create user
9. **IMPORTANT**: Copy the Access Key ID and Secret Access Key (you won't see them again!)

## Step 5: Add to .env File

Add these to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=your-bucket-name
```

## Step 6: Update Your Code

### Option A: Replace Cloudinary completely

In `src/controllers/video.controller.js`, replace the imports:

```javascript
// OLD
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

// NEW
import { uploadOnS3 as uploadOnCloudinary, deleteFromS3 as deleteFromCloudinary } from "../utils/s3.js"
```

### Option B: Use the S3-specific controller

In `src/routes/video.routes.js`, replace:

```javascript
// OLD
import { publishAVideo } from "../controllers/video.controller.js"

// NEW
import { publishAVideo } from "../controllers/video.controller.s3.js"
```

## Step 7: Test Upload

Restart your server and try uploading a video. It should work immediately!

## Cost Comparison

### Cloudinary Free Tier:
- 25 GB storage
- 25 GB bandwidth/month
- Limited transformations

### AWS S3 Free Tier (first 12 months):
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- 100 GB data transfer out

### After Free Tier:
- S3: ~$0.023/GB storage + $0.09/GB transfer
- Cloudinary: Starts at $99/month for 100GB

## Additional Features You Can Add

1. **Video Duration**: Use `fluent-ffmpeg` to get actual video duration
2. **Thumbnail Generation**: Use `fluent-ffmpeg` to generate thumbnails from video
3. **CloudFront CDN**: Add AWS CloudFront for faster video delivery
4. **Signed URLs**: Make videos private with time-limited access

## Troubleshooting

### "Access Denied" error:
- Check bucket policy is set correctly
- Verify IAM user has S3 permissions
- Make sure bucket is not blocking public access

### "Bucket not found":
- Verify bucket name in .env matches exactly
- Check region is correct

### Files upload but can't access:
- Check bucket policy allows public read
- Verify ACL is set to "public-read" in upload

## Need Help?

AWS has excellent documentation and the free tier is generous. S3 is industry-standard for video storage and much more reliable than Cloudinary for your use case.
