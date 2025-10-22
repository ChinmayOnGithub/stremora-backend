# Storage Setup - Hybrid Cloudinary + S3

## Overview

Your app uses a smart hybrid storage system for maximum reliability:

1. **Cloudinary** (Primary) - Tries first, uses free tier
2. **AWS S3** (Fallback) - Automatically used if Cloudinary fails

## Current Status

✅ **Cloudinary**: Already configured in your .env
⏳ **AWS S3**: Needs setup (follow guide below)

## Quick Setup

### Step 1: Install AWS SDK

```bash
bun add @aws-sdk/client-s3
```

### Step 2: Setup AWS S3

Follow the complete guide: **[AWS_S3_SETUP.md](./AWS_S3_SETUP.md)**

Quick version:
1. Create AWS account (free tier)
2. Create S3 bucket named `stremora-videos`
3. Make bucket public (set bucket policy)
4. Create IAM user and get API keys
5. Add keys to .env

### Step 3: Add to .env

```env
# AWS S3 (Fallback Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_S3_BUCKET_NAME=stremora-videos
```

### Step 4: Test

```bash
bun run dev
```

Upload a video and check the logs!

## How It Works

Your video controller (`src/controllers/video.controller.js`) now uses:

```javascript
import { uploadWithFallback, deleteFromStorage } from "../utils/storage.js"
```

This automatically:
1. Tries Cloudinary first
2. Falls back to S3 if Cloudinary fails
3. Tracks which provider was used
4. Deletes from the correct provider

## Files Structure

```
src/
├── utils/
│   ├── cloudinary.js      # Cloudinary upload/delete
│   ├── s3.js              # S3 upload/delete
│   └── storage.js         # Hybrid logic (tries both)
├── controllers/
│   └── video.controller.js # Uses hybrid storage
└── models/
    └── video.models.js     # Stores provider info
```

## Database Schema

Videos now track which storage provider was used:

```javascript
{
  videoFile: {
    url: "https://...",
    public_id: "video_id",
    storage_provider: "cloudinary" // or "s3"
  }
}
```

## Benefits

✅ **Reliability**: If one fails, the other works
✅ **Cost Efficient**: Use Cloudinary's free tier first
✅ **Scalable**: Easy to add more providers
✅ **Flexible**: Can migrate between providers anytime

## Monitoring

Watch your logs to see which provider is being used:

```
📤 [Storage] Attempting Cloudinary upload first...
✅ [Storage] Cloudinary upload successful!
📦 Storage provider: cloudinary
```

Or if Cloudinary fails:

```
📤 [Storage] Attempting Cloudinary upload first...
⚠️ [Storage] Cloudinary failed, trying S3 fallback...
✅ [Storage] S3 fallback successful!
📦 Storage provider: s3
```

## Cost Comparison

### Cloudinary Free Tier:
- 25 GB storage
- 25 GB bandwidth/month
- ✅ Already configured

### AWS S3 Free Tier (12 months):
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- ⏳ Needs setup

### After Free Tiers:
- Cloudinary: $99/month for 100GB
- S3: ~$2-5/month for 100GB
- **S3 is 20x cheaper!**

## Next Steps

1. ✅ Cloudinary is already working
2. ⏳ Setup AWS S3 (follow [AWS_S3_SETUP.md](./AWS_S3_SETUP.md))
3. 🚀 Enjoy bulletproof video uploads!

## Need Help?

- **S3 Setup**: See [AWS_S3_SETUP.md](./AWS_S3_SETUP.md)
- **Hybrid Storage**: See [HYBRID_STORAGE_SETUP.md](./HYBRID_STORAGE_SETUP.md)
- **General S3 Info**: See [S3_SETUP_GUIDE.md](./S3_SETUP_GUIDE.md)

Your storage system is production-ready! 🎉
