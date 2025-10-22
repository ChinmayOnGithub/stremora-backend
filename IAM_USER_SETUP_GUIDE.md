# IAM User Setup Guide - Step by Step

## Why IAM User?

**DON'T** use your root AWS account credentials (the email/password you signed up with)
**DO** create an IAM user with limited permissions (only S3 access)

### Benefits:
- ✅ More secure (limited permissions)
- ✅ Can be revoked if compromised
- ✅ Best practice for production apps
- ✅ Separate credentials for different apps

---

## Step-by-Step Guide

### Step 1: Login to AWS Console

Go to https://console.aws.amazon.com/ and login with your AWS account

### Step 2: Go to IAM Service

1. In the search bar at the top, type **"IAM"**
2. Click on **"IAM"** (Identity and Access Management)

### Step 3: Create New User

1. In the left sidebar, click **"Users"**
2. Click the **"Add users"** button (or "Create user" in newer UI)

### Step 4: Set User Details

**User name**: `stremora-uploader` (or any name you like)

**Access type**: 
- ✅ Check **"Access key - Programmatic access"**
- ❌ Don't check "AWS Management Console access" (not needed)

Click **"Next: Permissions"**

### Step 5: Set Permissions

Choose: **"Attach existing policies directly"**

In the search box, type: **"S3"**

Find and check: **"AmazonS3FullAccess"**

This gives the user full access to S3 (upload, delete, list files)

Click **"Next: Tags"**

### Step 6: Add Tags (Optional)

You can skip this or add:
- Key: `Project`, Value: `Stremora`
- Key: `Environment`, Value: `Production`

Click **"Next: Review"**

### Step 7: Review and Create

Review the details:
- User name: `stremora-uploader`
- AWS access type: Programmatic access
- Permissions: AmazonS3FullAccess

Click **"Create user"**

### Step 8: Save Your Credentials ⚠️ IMPORTANT!

You'll see a success page with:

```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**⚠️ CRITICAL**: 
- Copy both keys NOW
- You won't be able to see the Secret Access Key again!
- Store them securely (password manager recommended)

Click **"Download .csv"** to save a backup

---

## Add to Your .env File

Open your `.env` file and add:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=stremora-videos
```

Replace with your actual keys!

---

## Security Best Practices

### ✅ DO:
- Create separate IAM users for different apps
- Use IAM users (not root account)
- Store credentials in .env (never commit to git)
- Rotate keys periodically (every 90 days)
- Delete unused IAM users

### ❌ DON'T:
- Use root account credentials
- Commit .env to git
- Share credentials publicly
- Give more permissions than needed
- Hardcode credentials in code

---

## Verify It Works

After adding to .env, restart your server:

```bash
bun run dev
```

Try uploading a video. If S3 is used, you'll see:

```
✅ [Storage] S3 fallback successful!
📦 Storage provider: s3
```

---

## Troubleshooting

### "Access Denied" Error

**Problem**: IAM user doesn't have S3 permissions

**Solution**:
1. Go to IAM → Users → stremora-uploader
2. Click "Permissions" tab
3. Verify "AmazonS3FullAccess" is attached
4. If not, click "Add permissions" → "Attach existing policies" → Select "AmazonS3FullAccess"

### "Invalid Credentials" Error

**Problem**: Wrong keys in .env

**Solution**:
1. Double-check keys in .env match IAM user keys
2. No extra spaces or quotes
3. Restart server after changing .env

### "Bucket Not Found" Error

**Problem**: Bucket name mismatch

**Solution**:
1. Verify bucket exists in S3 console
2. Check bucket name in .env matches exactly
3. Check region is correct

---

## Alternative: More Restrictive Policy (Advanced)

If you want to limit permissions to only your specific bucket:

### Step 1: Create Custom Policy

1. Go to IAM → Policies → Create policy
2. Click "JSON" tab
3. Paste this (replace `stremora-videos` with your bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::stremora-videos",
                "arn:aws:s3:::stremora-videos/*"
            ]
        }
    ]
}
```

4. Name it: `StremoraS3Access`
5. Create policy

### Step 2: Attach to User

1. Go to IAM → Users → stremora-uploader
2. Remove "AmazonS3FullAccess"
3. Attach "StremoraS3Access"

This limits access to only your bucket (more secure!)

---

## Quick Reference

### What You Need:
1. ✅ IAM user created
2. ✅ AmazonS3FullAccess policy attached
3. ✅ Access Key ID copied
4. ✅ Secret Access Key copied
5. ✅ Keys added to .env
6. ✅ Server restarted

### Your .env Should Have:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
AWS_S3_BUCKET_NAME=stremora-videos
```

### Test Command:
```bash
bun run dev
# Upload a video and check logs
```

---

## Summary

1. **Create IAM user** → `stremora-uploader`
2. **Give S3 permissions** → `AmazonS3FullAccess`
3. **Get credentials** → Access Key ID + Secret Access Key
4. **Add to .env** → AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
5. **Test** → Upload a video

That's it! Your app can now upload to S3 securely. 🚀

---

## Need Help?

- AWS IAM Documentation: https://docs.aws.amazon.com/IAM/
- AWS Free Tier: https://aws.amazon.com/free/
- Security Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

Your IAM user is now ready to upload videos to S3! 🎉
