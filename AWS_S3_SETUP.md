# AWS S3 Setup Guide

Your app now uses a hybrid storage system:
- **Primary**: Cloudinary (tries first)
- **Fallback**: AWS S3 (if Cloudinary fails)

## Quick Setup

### 1. Install AWS SDK

```bash
bun add @aws-sdk/client-s3
```

### 2. Create AWS Account

Go to https://aws.amazon.com/ and sign up (free tier available)

### 3. Create S3 Bucket

1. Go to AWS Console → S3
2. Click "Create bucket"
3. Bucket name: `stremora-videos` (must be globally unique)
4. Region: `us-east-1` (or your preferred region)
5. **Uncheck "Block all public access"** ⚠️ Important!
6. Click "Create bucket"

### 4. Set Bucket Policy (Make Files Public)

1. Go to your bucket → Permissions → Bucket Policy
2. Click "Edit" and paste this (replace `stremora-videos` with your bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::stremora-videos/*"
        }
    ]
}
```

3. Click "Save changes"

### 5. Create IAM User (Get API Keys)

1. Go to AWS Console → IAM → Users
2. Click "Add users"
3. Username: `stremora-uploader`
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: **AmazonS3FullAccess**
8. Click through to create user
9. **IMPORTANT**: Copy the Access Key ID and Secret Access Key (you won't see them again!)

### 6. Add to .env File

Add these to your `.env`:

```env
# AWS S3 Configuration (Fallback Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=stremora-videos
```

### 7. Test It!

Restart your server:

```bash
bun run dev
```

Upload a video and watch the logs:

```
📤 [Storage] Attempting Cloudinary upload first...
⚠️ [Storage] Cloudinary failed, trying S3 fallback...
✅ [Storage] S3 fallback successful!
📦 Storage provider: s3
```

## How It Works

```
Upload Video
    ↓
Try Cloudinary First
    ↓
Success? → Use Cloudinary ✅
    ↓
Failed? → Try S3 Fallback
    ↓
Success? → Use S3 ✅
    ↓
Both Failed? → Error ❌
```

## Cost

### AWS Free Tier (First 12 Months):
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- 100 GB data transfer out

### After Free Tier:
- Storage: ~$0.023/GB/month
- Requests: $0.0004 per 1,000 GET, $0.005 per 1,000 PUT
- Transfer: $0.09/GB

**Example**: 100 videos (10GB) + 10k views/month = ~$1.50/month

Much cheaper than Cloudinary's paid plans!

## Troubleshooting

### "Access Denied" Error

**Problem**: Bucket policy not set correctly

**Solution**:
1. Go to bucket → Permissions → Bucket Policy
2. Make sure the policy allows public read (see step 4 above)
3. Verify "Block all public access" is OFF

### "Credentials Not Found" Error

**Problem**: AWS credentials not in .env

**Solution**:
1. Check `.env` has AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
2. Restart your server after adding credentials

### Files Upload But Can't Access

**Problem**: Bucket policy doesn't allow public read

**Solution**:
1. Check bucket policy (step 4)
2. Verify ACL is set to "public-read" in upload
3. Try accessing the URL directly in browser

### "Bucket Not Found" Error

**Problem**: Bucket name mismatch or wrong region

**Solution**:
1. Verify bucket name in .env matches exactly
2. Check region is correct
3. Make sure bucket exists in AWS Console

## Monitoring Usage

Check your AWS usage:
1. Go to AWS Console → Billing Dashboard
2. View "Free Tier" usage
3. Set up billing alerts (recommended!)

## Security Best Practices

1. **Never commit .env to git** (already in .gitignore)
2. **Use IAM user** (not root account)
3. **Limit permissions** (only S3, not full AWS access)
4. **Rotate keys** periodically
5. **Set up billing alerts** to avoid surprises

## Need Help?

- AWS Documentation: https://docs.aws.amazon.com/s3/
- AWS Free Tier: https://aws.amazon.com/free/
- Support: AWS has excellent documentation and community support

Your hybrid storage system is now ready! Videos will automatically fall back to S3 when Cloudinary has issues. 🚀
