# Test Scripts

This directory contains various test scripts and utilities for development and debugging.

## Structure

- `cloudinary/` - Cloudinary upload and configuration tests
- `utils/` - Utility test scripts
- `manual/` - Manual testing scripts for development

## Usage

Run tests from the project root:

```bash
# Test Cloudinary configuration
node tests/cloudinary/test-cloudinary.js

# Test video upload
node tests/cloudinary/test-video-upload.js

# Test image upload  
node tests/cloudinary/test-image-upload.js

# Add demo videos to database
node tests/utils/add-demo-videos.js
```

## Environment

Make sure your `.env` file is properly configured before running any tests.