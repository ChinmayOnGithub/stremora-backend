# Stremora Backend API

<div align="center">

![Stremora Banner](https://placehold.co/1200x300/1a1a1a/f59e0b?text=Stremora&font=raleway)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/ChinmayOnGithub/stremora-backend)

**A robust, scalable video-sharing platform backend built with modern Node.js technologies**

[🚀 Live Demo](https://stremora-api.render.com) · [📖 API Documentation](https://stremora-docs.vercel.app) · [🐛 Report Bug](https://github.com/ChinmayOnGithub/stremora-backend/issues)

</div>

---

## 📋 Table of Contents

- [About Stremora](#about-stremora)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [License](#license)

---

## About Stremora

Stremora is a modern **video-sharing platform backend** that provides a comprehensive RESTful API for building video streaming applications. Built with scalability and performance in mind, it handles everything from user authentication to video management and social interactions.

### Why Stremora?

- **🔒 Security-First**: Comprehensive JWT authentication with email verification
- **☁️ Cloud-Native**: Seamless integration with Cloudinary for media management  
- **📈 Scalable**: Built to handle high-volume video uploads and user interactions
- **🎛️ Feature-Rich**: Complete social features including likes, comments, and subscriptions
- **🔧 Developer-Friendly**: Clean, well-documented API with consistent response patterns

---

## Key Features

### Authentication & Security
- JWT-based authentication with access and refresh tokens
- Email verification system with 6-digit verification codes
- Password reset flow with secure token-based reset mechanism
- bcrypt password hashing for enhanced security

### Video Management
- Full CRUD operations for video content
- Cloudinary integration for high-quality video storage and delivery
- Automatic thumbnail generation and management
- Video analytics with view tracking

### Social Features
- User subscriptions and channel management
- Like/Unlike system for videos and comments
- Nested comment system with threaded discussions
- User profiles with customizable avatars and cover images

### Advanced Features
- MongoDB aggregation pipelines for complex data queries
- Email service integration via Nodemailer
- File upload handling with Multer and Cloudinary
- Comprehensive error handling with custom ApiError classes
- Async wrapper utilities for clean error management

---

## Tech Stack

**Backend**: Node.js, Express.js, JavaScript

**Database**: MongoDB with Mongoose ODM

**Authentication**: JWT (jsonwebtoken), bcrypt

**File Storage**: Cloudinary for cloud-based media management

**Email Service**: Nodemailer

**Runtime**: Bun for fast package management

**Deployment**: Render

---

## Project Architecture

Stremora follows a modular, three-layer architecture designed for maintainability and scalability:

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Layer                               │
│     Routes → Controllers → Middleware                      │
├─────────────────────────────────────────────────────────────┤
│                  Service Layer                             │
│            Business Logic & Data Processing                │
├─────────────────────────────────────────────────────────────┤
│                Data Access Layer                           │
│         MongoDB via Mongoose ODM & Cloudinary              │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

- **Separation of Concerns**: Each layer has distinct responsibilities
- **Error-First Design**: Comprehensive error handling throughout the stack
- **Async/Await Pattern**: Non-blocking operations for optimal performance
- **Modular Structure**: Clean organization for maintainability

---

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- Bun (latest version)  
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChinmayOnGithub/stremora-backend.git
   cd stremora-backend
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stremora

# CORS
CORS_ORIGIN=http://localhost:5173

# JWT Secrets
ACCESS_TOKEN_SECRET=your_super_secret_access_token_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_here
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Running the Application

```bash
# Development mode
bun run dev

# Production mode
bun start
```

Server will be running at `http://localhost:8000`

---

## API Endpoints

### Base URL
```
Production: https://stremora-api.render.com/api/v1
Development: http://localhost:8000/api/v1
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/register` | Create new user account |
| `POST` | `/users/login` | User login |
| `POST` | `/users/logout` | User logout |
| `GET` | `/users/current-user` | Get current user info |
| `POST` | `/users/forgot-password` | Send password reset email |
| `POST` | `/users/reset-password` | Reset user password |

### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/email/verify` | Verify email with code |
| `POST` | `/email/resend` | Resend verification code |

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/videos` | Get all videos (paginated) |
| `POST` | `/videos` | Upload new video |
| `GET` | `/videos/:videoId` | Get specific video |
| `PATCH` | `/videos/:videoId` | Update video details |
| `DELETE` | `/videos/:videoId` | Delete video |

### Social Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/subscriptions/:channelId` | Subscribe to channel |
| `DELETE` | `/subscriptions/:channelId` | Unsubscribe from channel |
| `POST` | `/likes/video/:videoId` | Like/unlike video |
| `POST` | `/comments/:videoId` | Add comment to video |
| `GET` | `/comments/:videoId` | Get video comments |

---

## Authentication Flow

Stremora implements a sophisticated authentication system:

1. **Registration**: User creates account → Email verification code sent → Account created (unverified)
2. **Email Verification**: User enters 6-digit code → Email marked as verified
3. **Login**: Credentials validated → Email verification checked → JWT tokens issued
4. **Token Management**: Short-lived access tokens with long-lived refresh tokens
5. **Password Reset**: Secure token-based reset with SHA256 hashing

### Security Features

- **Email Verification Required**: Users cannot login without email verification
- **Secure Password Hashing**: bcrypt with salt rounds
- **JWT Token Strategy**: Separate access and refresh tokens
- **Password Reset Security**: Cryptographically secure tokens with expiration

---

## Project Structure

```
stremora-backend/
├── src/
│   ├── controllers/          # Request handlers and business logic
│   ├── models/               # MongoDB schemas and models
│   ├── routes/               # API route definitions  
│   ├── middlewares/          # Custom middleware functions
│   ├── utils/                # Utility functions and classes
│   ├── db/                   # Database connection logic
│   ├── app.js                # Express app configuration
│   └── index.js              # Server entry point
├── public/                   # Static assets and temp files
├── .env.example              # Environment variables template
├── package.json              # Project dependencies and scripts
└── README.md                 # Project documentation
```

### Key Components

**Middleware Layer**
- `auth.middleware.js`: JWT token validation and user authentication
- `multer.middleware.js`: File upload handling for videos and images

**Utility Classes**
- `ApiError.js`: Standardized error handling with HTTP status codes
- `ApiResponse.js`: Consistent API response formatting
- `asyncHandler.js`: Promise-based error handling wrapper
- `cloudinary.js`: Cloud storage integration utilities

**Database Models**
- User Model: Authentication, profiles, and user management
- Video Model: Video metadata, file URLs, and engagement metrics
- Subscription Model: User-to-channel relationship management
- Comment Model: Threaded commenting system

---

## Deployment

### Render Configuration

Deployed on [Render](https://render.com/) with the following setup:

- **Build Command**: `bun install`
- **Start Command**: `node src/index.js`
- **Environment**: Node.js
- **Auto-Deploy**: Enabled from `main` branch

### Environment Variables

Configure production environment variables in Render dashboard:
- Database connections (MongoDB Atlas recommended)
- Cloudinary credentials
- JWT secrets (use strong, random strings)
- Email service credentials
- CORS origins (frontend URL)

### Health Check

```bash
GET /api/v1/healthcheck
```

Response:
```json
{
  "success": true,
  "message": "API is running successfully",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using Node.js, Express, and MongoDB**

[Repository](https://github.com/ChinmayOnGithub/stremora-backend) · [Issues](https://github.com/ChinmayOnGithub/stremora-backend/issues)

</div>
