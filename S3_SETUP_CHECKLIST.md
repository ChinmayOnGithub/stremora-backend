# S3 Setup Checklist - Complete Guide

Follow these steps in order. Each step takes 2-3 minutes.

---

## ☐ Step 1: Install AWS SDK

```bash
bun add @aws-sdk/client-s3
```

**Time**: 30 seconds

---

## ☐ Step 2: Create AWS Account

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process
4. You'll need:
   - Email address
   - Credit card (won't be charged with free tier)
   - Phone number for verification

**Time**: 5 minutes

---

## ☐ Step 3: Create S3 Bucket

1. Login to AWS Console: https://console.aws.amazon.com/
2. Search for "S3" in the top search bar
3. Click "Create bucket"
4. Settings:
   - **Bucket name**: `stremora-videos` (must be globally unique, try adding your name if taken)
   - **Region**: `us-east-1` (or your preferred region)
   - **Block Public Access**: ⚠️ **UNCHECK ALL** (we need public access for video streaming)
   - Leave other settings as default
5. Click "Create bucket"

**Time**: 2 minutes

---

## ☐ Step 4: Make Bucket Public (Set Policy)

1. Go to your bucket → Click on it
2. Click "Permissions" tab
3. Scroll to "Bucket policy"
4. Click "Edit"
5. Paste this (replace `stremora-videos` with YOUR bucket name):

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

6. Click "Save changes"

**Time**: 2 minutes

---

## ☐ Step 5: Create IAM User

1. Search for "IAM" in the top search bar
2. Click "Users" in the left sidebar
3. Click "Add users" (or "Create user")
4. Settings:
   - **User name**: `stremora-uploader`
   - **Access type**: ✅ Check "Access key - Programmatic access"
   - ❌ Don't check "Console access"
5. Click "Next: Permissions"

**Time**: 1 minute

---

## ☐ Step 6: Give S3 Permissions

1. Select "Attach existing policies directly"
2. In the search box, type: `S3`
3. Check the box for: **AmazonS3FullAccess**
4. Click "Next: Tags" (skip tags)
5. Click "Next: Review"
6. Click "Create user"

**Time**: 1 minute

---

## ☐ Step 7: Save Credentials ⚠️ CRITICAL!

You'll see a success page with:

```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**⚠️ IMPORTANT**:
- Copy BOTH keys NOW
- You won't see the Secret Access Key again!
- Click "Download .csv" to save a backup
- Store securely (password manager recommended)

**Time**: 1 minute

---

## ☐ Step 8: Add to .env File

Open your `.env` file and add these lines:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=stremora-videos
```

Replace with YOUR actual values!

**Time**: 1 minute

---

## ☐ Step 9: Test It!

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

**Time**: 1 minute

---

## ☐ Step 10: Verify in AWS Console

1. Go to S3 Console
2. Click on your bucket: `stremora-videos`
3. You should see folders: `videos/` and/or `images/`
4. Click into `videos/` to see your uploaded files

**Time**: 1 minute

---

## Total Time: ~15 minutes

---

## Checklist Summary

- ☐ AWS SDK installed
- ☐ AWS account created
- ☐ S3 bucket created
- ☐ Bucket made public (policy set)
- ☐ IAM user created
- ☐ S3 permissions given to user
- ☐ Credentials saved
- ☐ Credentials added to .env
- ☐ Server restarted
- ☐ Upload tested

---

## Your .env Should Look Like:

```env
# Existing Cloudinary config
CLOUDINARY_CLOUD_NAME=dmoyyrmxr
CLOUDINARY_API_KEY=314874596436248
CLOUDINARY_API_SECRET=SqgNEIl400g6fy4d1LXcM6WdY4k

# New AWS S3 config
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your_key...
AWS_SECRET_ACCESS_KEY=wJal...your_secret...
AWS_S3_BUCKET_NAME=stremora-videos
```

---

## Common Issues

### Issue: "Bucket name already exists"
**Solution**: Bucket names are globally unique. Try:
- `stremora-videos-yourname`
- `stremora-videos-2024`
- `yourname-stremora-videos`

### Issue: "Access Denied" when uploading
**Solution**: 
1. Check bucket policy is set (Step 4)
2. Verify IAM user has S3 permissions (Step 6)
3. Check credentials in .env are correct

### Issue: "Can't access uploaded videos"
**Solution**:
1. Verify bucket policy allows public read (Step 4)
2. Check "Block Public Access" is OFF
3. Try accessing the URL directly in browser

---

## Need Detailed Help?

- **IAM User Setup**: See [IAM_USER_SETUP_GUIDE.md](./IAM_USER_SETUP_GUIDE.md)
- **Complete S3 Guide**: See [AWS_S3_SETUP.md](./AWS_S3_SETUP.md)
- **How It Works**: See [STORAGE_SETUP.md](./STORAGE_SETUP.md)

---

## Done! 🎉

Your app now has:
- ✅ Cloudinary (primary storage)
- ✅ AWS S3 (fallback storage)
- ✅ Automatic failover
- ✅ Production-ready setup

Upload a video and watch the magic happen! 🚀
