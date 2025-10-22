# Hybrid Storage Setup (Cloudinary + S3 Fallback)

## Overview

Your app now uses a smart hybrid storage strategy:
1. **Primary**: Cloudinary (free tier - 25GB storage, 25GB bandwidth)
2. **Fallback**: AWS S3 (when Cloudinary fails or is unavailable)

## How It Works

```
Upload Request
    ↓
Try Cloudinary First
    ↓
Success? → Use Cloudinary (mark as "cloudinary")
    ↓
Failed? → Try S3 Fallback (mark as "s3")
    ↓
Store video with provider info in database
```

## Setup Steps

### 1. Install AWS SDK (for S3 fallback)

```bash
bun add @aws-sdk/client-s3
```

### 2. Add S3 Credentials to .env

Add these to your existing `.env` file:

```env
# Existing Cloudinary config (keep these)
CLOUDINARY_CLOUD_NAME=dmoyyrmxr
CLOUDINARY_API_KEY=314874596436248
CLOUDINARY_API_SECRET=SqgNEIl400g6fy4d1LXcM6WdY4k

# New S3 config (add these)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=stremora-videos
```

### 3. Setup AWS S3 (Quick Steps)

1. **Create AWS Account**: https://aws.amazon.com/ (free tier available)

2. **Create S3 Bucket**:
   - Go to S3 Console
   - Click "Create bucket"
   - Name: `stremora-videos` (or your choice)
   - Region: `us-east-1`
   - Uncheck "Block all public access"
   - Create bucket

3. **Set Bucket Policy**:
   - Go to bucket → Permissions → Bucket Policy
   - Add this policy (replace YOUR-BUCKET-NAME):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

4. **Create IAM User**:
   - Go to IAM → Users → Add user
   - Name: `stremora-uploader`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Copy Access Key ID and Secret Access Key

### 4. Test the Setup

Restart your server and try uploading a video:

```bash
bun run dev
```

Watch the console logs:
- `📤 [Storage] Attempting Cloudinary upload first...`
- If Cloudinary works: `✅ [Storage] Cloudinary upload successful!`
- If Cloudinary fails: `⚠️ [Storage] Cloudinary failed, trying S3 fallback...`
- Then: `✅ [Storage] S3 fallback successful!`

## Benefits of This Approach

### 1. **Reliability**
- If Cloudinary has issues, S3 takes over automatically
- No downtime for your users

### 2. **Cost Optimization**
- Use Cloudinary's free tier first (25GB free)
- Only use S3 when needed (pay-as-you-go)
- Best of both worlds

### 3. **Flexibility**
- Can switch providers anytime
- Database tracks which provider stores each video
- Easy to migrate videos between providers later

### 4. **Production Ready**
- Industry-standard approach
- Used by major platforms
- Scalable architecture

## Database Schema

Videos now store which provider was used:

```javascript
{
  videoFile: {
    url: "https://...",
    public_id: "video_id",
    storage_provider: "cloudinary" // or "s3"
  }
}
```

## Monitoring

Check your logs to see which provider is being used:

```
📦 Storage provider: cloudinary  // Using Cloudinary
📦 Storage provider: s3          // Using S3 fallback
```

## Cost Tracking

### Cloudinary Free Tier:
- 25 GB storage
- 25 GB bandwidth/month
- Monitor at: https://cloudinary.com/console

### AWS S3 Free Tier (first 12 months):
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- Monitor at: https://console.aws.amazon.com/billing/

## Troubleshooting

### Both providers fail:
1. Check Cloudinary credentials in .env
2. Check S3 credentials in .env
3. Verify S3 bucket exists and is accessible
4. Check bucket policy allows public read

### Videos upload but can't play:
1. Check bucket policy is set correctly
2. Verify CORS settings if needed
3. Test URL directly in browser

### Want to force S3 only:
In `src/utils/storage.js`, comment out Cloudinary attempt and go straight to S3.

## Future Enhancements

1. **Load Balancing**: Distribute uploads between providers
2. **Cost Optimization**: Choose provider based on file size
3. **Migration Tool**: Move videos from Cloudinary to S3 when free tier runs out
4. **Analytics**: Track which provider is used most

## Need Help?

The hybrid approach is now set up and ready to go. Just add your S3 credentials and it will automatically fall back to S3 when Cloudinary has issues!
