# YouTube Backend Clone

## Overview
This is a backend system for a YouTube-like video platform, built to handle video uploads, storage, and streaming. It uses **Cloudinary** for video uploads and link generation. This project was created as a learning experience for the **MERN stack**.

## Features
- User authentication & authorization
- Video upload and storage using Cloudinary
- Video metadata management (title, description, etc.)
- Like, comment, and view tracking
- Playlist and subscription management

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Cloud Storage:** Cloudinary
- **Authentication:** JWT (JSON Web Token)

## Project Structure
```
.
├── app.js
├── constants.js
├── controllers
│   ├── comment.controller.js
│   ├── dashboard.controller.js
│   ├── healthcheck.controller.js
│   ├── like.controller.js
│   ├── playlist.controller.js
│   ├── subscription.controller.js
│   ├── tweet.controller.js
│   ├── user.controller.js
│   └── video.controller.js
├── db
│   └── index.js
├── index.js
├── middlewares
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── multer.middleware.js
├── models
│   ├── comment.models.js
│   ├── like.models.js
│   ├── playlist.models.js
│   ├── subscription.models.js
│   ├── tweet.models.js
│   ├── user.models.js
│   └── video.models.js
├── routes
│   ├── comment.routes.js
│   ├── dashboard.routes.js
│   ├── healthcheck.routes.js
│   ├── like.routes.js
│   ├── playlist.routes.js
│   ├── subscription.routes.js
│   ├── tweet.routes.js
│   ├── user.routes.js
│   └── video.routes.js
└── utils
    ├── ApiError.js
    ├── ApiResponse.js
    ├── asyncHandler.js
    └── cloudinary.js
```

## API Endpoints
### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Videos
- `POST /api/videos/upload` - Upload a video (requires authentication)
- `GET /api/videos/:id` - Get video details
- `GET /api/videos/stream/:id` - Stream video *(Note: Streaming is not functional yet, as the frontend is not implemented.)*

### Interactions
- `POST /api/videos/:id/like` - Like a video
- `POST /api/videos/:id/comment` - Comment on a video

## Notes
- This project is **backend-only**. Some endpoints will not work as expected without a frontend.
- Streaming functionality is not implemented yet.
- All testing was done using **Postman**.

## Future Improvements
- Implement search and recommendations
- Add video categories and tags
- Improve video transcoding for adaptive streaming
- Develop a frontend to make the application fully functional

## License
This project is open-source and available under the **MIT License**.
