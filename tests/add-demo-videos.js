import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Video } from '../src/models/video.models.js';
import { User } from '../src/models/user.models.js';

// Load environment variables
dotenv.config();

// Demo videos data - you can customize these
const demoVideos = [
    {
        title: "Building a Modern React App",
        description: "Learn how to build a modern React application with hooks, context, and best practices. This comprehensive tutorial covers everything from setup to deployment.",
        videoFile: {
            url: "https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4",
            public_id: "demo/sample_video_1"
        },
        thumbnail: {
            url: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample_thumbnail.jpg",
            public_id: "demo/sample_thumbnail_1"
        },
        duration: "15:30",
        views: 1250,
        isPublished: true
    },
    {
        title: "JavaScript ES6+ Features Explained",
        description: "Dive deep into modern JavaScript features including arrow functions, destructuring, async/await, and more. Perfect for developers looking to upgrade their skills.",
        videoFile: {
            url: "https://res.cloudinary.com/demo/video/upload/v1234567891/sample2.mp4",
            public_id: "demo/sample_video_2"
        },
        thumbnail: {
            url: "https://res.cloudinary.com/demo/image/upload/v1234567891/sample_thumbnail2.jpg",
            public_id: "demo/sample_thumbnail_2"
        },
        duration: "22:45",
        views: 890,
        isPublished: true
    },
    {
        title: "Node.js Backend Development",
        description: "Complete guide to building scalable backend applications with Node.js, Express, and MongoDB. Includes authentication, API design, and deployment strategies.",
        videoFile: {
            url: "https://res.cloudinary.com/demo/video/upload/v1234567892/sample3.mp4",
            public_id: "demo/sample_video_3"
        },
        thumbnail: {
            url: "https://res.cloudinary.com/demo/image/upload/v1234567892/sample_thumbnail3.jpg",
            public_id: "demo/sample_thumbnail_3"
        },
        duration: "28:12",
        views: 2100,
        isPublished: true
    },
    {
        title: "CSS Grid and Flexbox Mastery",
        description: "Master modern CSS layout techniques with Grid and Flexbox. Learn how to create responsive, beautiful layouts that work across all devices.",
        videoFile: {
            url: "https://res.cloudinary.com/demo/video/upload/v1234567893/sample4.mp4",
            public_id: "demo/sample_video_4"
        },
        thumbnail: {
            url: "https://res.cloudinary.com/demo/image/upload/v1234567893/sample_thumbnail4.jpg",
            public_id: "demo/sample_thumbnail_4"
        },
        duration: "18:55",
        views: 756,
        isPublished: true
    },
    {
        title: "Docker for Developers",
        description: "Learn containerization with Docker. From basic concepts to advanced deployment strategies, this tutorial covers everything you need to know about Docker.",
        videoFile: {
            url: "https://res.cloudinary.com/demo/video/upload/v1234567894/sample5.mp4",
            public_id: "demo/sample_video_5"
        },
        thumbnail: {
            url: "https://res.cloudinary.com/demo/image/upload/v1234567894/sample_thumbnail5.jpg",
            public_id: "demo/sample_thumbnail_5"
        },
        duration: "31:20",
        views: 1680,
        isPublished: true
    }
];

async function addDemoVideos() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Find a user to assign as owner (use your existing user)
        const user = await User.findOne(); // Gets the first user
        if (!user) {
            console.error("❌ No users found. Please create a user first.");
            process.exit(1);
        }

        console.log(`📝 Using user: ${user.username} (${user.email}) as video owner`);

        // Add owner to each video
        const videosWithOwner = demoVideos.map(video => ({
            ...video,
            owner: user._id
        }));

        // Insert demo videos
        const insertedVideos = await Video.insertMany(videosWithOwner);
        
        console.log(`🎉 Successfully added ${insertedVideos.length} demo videos:`);
        insertedVideos.forEach((video, index) => {
            console.log(`   ${index + 1}. ${video.title} (${video.duration})`);
        });

        console.log("\n📊 Summary:");
        console.log(`- Total videos: ${insertedVideos.length}`);
        console.log(`- Owner: ${user.username}`);
        console.log(`- All videos are published and ready to view`);

    } catch (error) {
        console.error("❌ Error adding demo videos:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

// Run the script
addDemoVideos();