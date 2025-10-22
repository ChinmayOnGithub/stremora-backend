# Storage System Overview

## Current Status

✅ **Cloudinary**: Active and working
⏳ **S3 Fallback**: Code ready, needs AWS setup (see [TODO_S3_IMPLEMENTATION.md](./TODO_S3_IMPLEMENTATION.md))

---

## How It Works

### Current (Cloudinary Only)
```
Upload → Cloudinary → Success ✅ or Fail ❌
```

### After S3 Setup (Hybrid)
```
Upload → Cloudinary → Success ✅
              ↓
            Fail?
              ↓
           Try S3 → Success ✅ or Fail ❌
```

---

## Files

### Core Storage Files
- `src/utils/cloudinary.js` - Cloudinary upload/delete
- `src/utils/s3.js` - S3 upload/delete (ready, needs AWS setup)
- `src/utils/storage.js` - Hybrid logic (tries both)

### Controllers
- `src/controllers/video.controller.js` - Uses hybrid storage

### Models
- `src/models/video.models.js` - Tracks which provider was used

---

## Documentation

### Quick Start
- [TODO_S3_IMPLEMENTATION.md](./TODO_S3_IMPLEMENTATION.md) - What's needed for S3

### Setup Guides
- [S3_SETUP_CHECKLIST.md](./S3_SETUP_CHECKLIST.md) - Step-by-step checklist
- [IAM_USER_SETUP_GUIDE.md](./IAM_USER_SETUP_GUIDE.md) - Create IAM user
- [AWS_S3_SETUP.md](./AWS_S3_SETUP.md) - Complete S3 setup

### Technical Details
- [STORAGE_SETUP.md](./STORAGE_SETUP.md) - How hybrid storage works
- [HYBRID_STORAGE_SETUP.md](./HYBRID_STORAGE_SETUP.md) - Architecture details
- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Quick overview

---

## To Activate S3 Fallback

1. Install AWS SDK: `bun add @aws-sdk/client-s3`
2. Follow [S3_SETUP_CHECKLIST.md](./S3_SETUP_CHECKLIST.md)
3. Add AWS credentials to .env
4. Restart server
5. Done!

---

## Environment Variables

### Current (.env)
```env
# Cloudinary (Active)
CLOUDINARY_CLOUD_NAME=dmoyyrmxr
CLOUDINARY_API_KEY=314874596436248
CLOUDINARY_API_SECRET=SqgNEIl400g6fy4d1LXcM6WdY4k
```

### After S3 Setup (add these)
```env
# AWS S3 (Fallback)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=stremora-videos
```

---

## Benefits of S3 Fallback

- ✅ Reliability (automatic failover)
- ✅ Cost savings (S3 is 20x cheaper)
- ✅ Scalability (industry standard)
- ✅ Flexibility (easy to migrate)

---

## Current Behavior

- Uploads use Cloudinary
- If Cloudinary fails, upload fails
- No fallback option yet

## After S3 Setup

- Uploads try Cloudinary first
- If Cloudinary fails, automatically tries S3
- Reliable uploads always work

---

## Questions?

See [TODO_S3_IMPLEMENTATION.md](./TODO_S3_IMPLEMENTATION.md) for complete details.

All documentation is ready when you want to implement S3! 🚀
