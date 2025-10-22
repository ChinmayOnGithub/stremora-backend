// upload.test.js
// Usage:
//   # preferred (handles spaces automatically)
//   node tests/upload.test.js /full/path/to/your video.mp4
//   # or relative to project root
//   node tests/upload.test.js ./public/temp/test.mp4

import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load .env from the project root (cwd). If you keep .env elsewhere, change the path.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Import your cloudinary helpers - adjust path if your file lives elsewhere
import cloudinary, { uploadOnCloudinary, deleteFromCloudinary } from "../src/utils/cloudinary.js";

// --- Small mocks for standalone run ---
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
class ApiResponse {
  constructor(status, data, message) {
    this.status = status;
    this.data = data;
    this.message = message;
  }
}
const asyncHandler = (fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error("asyncHandler caught error:", err?.response?.body || err);
  }
};

const User = {
  async findById(id) {
    return id ? { _id: id, name: "Test User" } : null;
  }
};
const VideoModel = { async create(doc) { return { ...doc, _id: "fake_video_id_123" }; } };

// Helper to show Cloudinary config (masked)
function showCloudinaryConfig() {
  try {
    const cfg = cloudinary?.config ? cloudinary.config() : null;
    console.log("[Cloudinary] runtime config:", {
      cloud_name: cfg?.cloud_name,
      api_key: cfg?.api_key,
      api_secret: cfg?.api_secret ? "[hidden]" : undefined,
    });
    if (!cfg?.cloud_name || !cfg?.api_key || !cfg?.api_secret) {
      console.warn("[Cloudinary] WARNING: Missing Cloudinary env vars. Check .env (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET) and that you run from project root.");
    }
  } catch (e) {
    console.warn("[Cloudinary] could not read config()", e);
  }
}

// publishAVideo (verbose) — uses uploadOnCloudinary imported from your helper
export const publishAVideo = asyncHandler(async (req, res) => {
  console.log("\n[publishAVideo] called");

  const { title, description } = req.body || {};
  if (!title?.trim() || !description?.trim()) throw new ApiError(400, "Title and description are required");

  const user = await User.findById(req.user?._id || "test_user_id");
  if (!user) throw new ApiError(404, "User not found!");

  const videoFile = req.files?.videoFile?.[0];
  if (!videoFile?.path) throw new ApiError(400, "Video file is required");

  console.log("[publishAVideo] videoFile metadata:", { originalname: videoFile.originalname, mimetype: videoFile.mimetype, path: videoFile.path });

  if (!fs.existsSync(videoFile.path)) throw new ApiError(400, "Video file missing: " + videoFile.path);

  const stats = fs.statSync(videoFile.path);
  console.log("[publishAVideo] file size (bytes):", stats.size);

  showCloudinaryConfig();

  // Upload
  let videoCloudinary = null;
  try {
    console.log("[publishAVideo] calling uploadOnCloudinary...");
    videoCloudinary = await uploadOnCloudinary(videoFile.path, videoFile.mimetype || "");
    console.log("[publishAVideo] upload result:", {
      public_id: videoCloudinary?.public_id,
      url: videoCloudinary?.secure_url || videoCloudinary?.url,
      duration: videoCloudinary?.duration,
    });
  } catch (err) {
    console.error("[publishAVideo] upload failed:", err?.response?.body || err);
    // Attempt cleanup if we got partial id
    if (err?.response?.body?.public_id) {
      try { await deleteFromCloudinary(err.response.body.public_id, "video"); } catch (e) { /* ignore */ }
    }
    throw new ApiError(500, "Failed to upload video to Cloudinary");
  }

  if (!videoCloudinary?.public_id || !(videoCloudinary?.secure_url || videoCloudinary?.url)) {
    throw new ApiError(500, "Invalid Cloudinary response");
  }

  // Generate a thumbnail URL (auto)
  let thumbnailUrl = "";
  try {
    thumbnailUrl = cloudinary.url(videoCloudinary.public_id, {
      resource_type: "video",
      transformation: [{ width: 400, height: 225, crop: "fill" }, { start_offset: "2" }, { format: "jpg" }]
    });
    console.log("[publishAVideo] Generated thumbnail:", thumbnailUrl);
  } catch (err) {
    console.warn("[publishAVideo] thumbnail generation failed:", err?.response?.body || err);
  }

  const duration = videoCloudinary.duration || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const videoDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const videoDoc = {
    videoFile: videoCloudinary.secure_url || videoCloudinary.url,
    thumbnail: thumbnailUrl,
    title, description, duration: videoDuration, owner: user._id
  };

  const saved = await VideoModel.create(videoDoc);
  console.log("[publishAVideo] Mock saved doc:", saved);

  if (res && typeof res.status === "function") return res.status(201).json(new ApiResponse(201, saved, "Video published successfully"));
  return saved;
});

// ---------------- CLI harness ----------------
// Key change: reconstruct the file path from ALL CLI args so unquoted paths with spaces still work.
if (process.argv[1] && process.argv[1].endsWith("upload.test.js")) {
  (async () => {
    console.log("\n=== Running upload.test.js harness ===");

    // Reconstruct CLI path from all provided args (helps if path contains spaces and user didn't quote).
    // Example:
    //  node upload.test.js /home/me/Development/GitHub Repos/Stremora/... (unquoted)
    // process.argv.slice(2) will be ['/home/me/Development/GitHub', 'Repos/Stremora/...']
    // Join them back with space to produce the intended path.
    const rawArgs = process.argv.slice(2);
    const reconstructed = rawArgs.length ? rawArgs.join(" ") : null;

    // Use reconstructed path if provided, otherwise default to project-relative test path
    const cliPath = reconstructed || "./public/temp/test.mp4";

    // Resolve against process.cwd() so it behaves consistently when run from project root
    const absPath = path.resolve(process.cwd(), cliPath);

    console.log("[harness] resolved test file:", absPath);
    if (!fs.existsSync(absPath)) {
      console.error("[harness] ERROR: Test file does not exist at:", absPath);
      console.error("[harness] Make sure you either:");
      console.error("  - pass a valid path (quoting is recommended if it contains spaces),");
      console.error("  - or place a test file at ./public/temp/test.mp4 and run from project root.");
      console.error("");
      console.error("Examples:");
      console.error("  node tests/upload.test.js ./public/temp/test.mp4");
      console.error("  node tests/upload.test.js \"/home/chinmay/Development/GitHub Repos/Stremora/stremora-backend/public/temp/test.mp4\"");
      process.exit(1);
    }

    // Fake req/res shaped like Multer diskStorage output
    const fakeReq = {
      body: { title: "Test Video", description: "Test description" },
      user: { _id: "test_user_id" },
      files: { videoFile: [{ originalname: path.basename(absPath), mimetype: "video/mp4", path: absPath }] }
    };

    const fakeRes = {
      status(code) { this._status = code; return this; },
      json(payload) { console.log("[harness] Response status:", this._status); console.log("[harness] Response payload:", payload); }
    };

    try {
      await publishAVideo(fakeReq, fakeRes);
      console.log("\n[harness] publishAVideo finished successfully");
      process.exit(0);
    } catch (err) {
      console.error("\n[harness] publishAVideo failed:", err?.response?.body || err);
      process.exit(1);
    }
  })();
}