# Stremora Backend

Video storage and management platform backend with hybrid cloud storage (Cloudinary + AWS S3).

## Tech Stack

- **Framework:** Express.js
- **Database:** MongoDB
- **Storage:** Cloudinary (primary) + AWS S3 (fallback)
- **Auth:** JWT
- **Email:** Nodemailer

## Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.production.example .env
# Edit .env with your credentials

# Run development server
bun run dev

# Server starts on http://localhost:8000
```

## Environment Variables

Required variables in `.env`:

```env
# Server
PORT=8000
CORS_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary (Primary Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (Fallback Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your-bucket-name

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=your_email

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Storage System

Hybrid storage with automatic fallback:

1. **Cloudinary** - Tries first (25GB free tier)
2. **AWS S3** - Automatic fallback if Cloudinary fails

Files are organized in folders:
- `videos/` - Video files
- `thumbnails/` - Video thumbnails
- `avatars/` - User profile pictures
- `covers/` - Channel cover images

### Local Testing (MinIO)

For local S3 testing without AWS:

```bash
# Start MinIO
docker run -d -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"

# Update .env
USE_LOCAL_S3=true
LOCAL_S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=stremora-videos
```

Create bucket at http://localhost:9001 (login: minioadmin/minioadmin)

### Production (AWS S3)

```env
USE_LOCAL_S3=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET_NAME=stremora-videos
```

See `docs/AWS_S3_PRODUCTION_SETUP.md` for detailed AWS setup.

## API Endpoints

- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/video/publish` - Upload video
- `GET /api/v1/video` - Get all videos
- `GET /api/v1/video/:id` - Get video by ID
- `PATCH /api/v1/users/avatar` - Update avatar
- `PATCH /api/v1/users/cover-image` - Update cover

Full API documentation: See routes in `src/routes/`

## Features

- JWT authentication with refresh tokens
- Email verification
- Video upload with metadata extraction (FFmpeg)
- Automatic thumbnail generation
- Like/comment system
- Watch history tracking
- Subscription management
- Admin dashboard

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middlewares/    # Auth, error handling
│   ├── utils/          # Storage, email, helpers
│   └── db/             # Database connection
├── public/temp/        # Temporary upload files
└── logs/               # Application logs
```

## Deployment

Backend is deployed on AWS. Update environment variables for production.

## License

ISC
