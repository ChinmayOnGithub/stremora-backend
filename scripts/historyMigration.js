import mongoose from "mongoose";
import History from "../src/models/history.models.js";
import dotenv from "dotenv";

dotenv.config();

const migrateHistory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected");

    // Fix duplicate history entries
    const duplicates = await History.aggregate([
      {
        $group: {
          _id: { user: "$user", video: "$video" },
          dups: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    for (const doc of duplicates) {
      const [first, ...rest] = doc.dups;
      await History.deleteMany({ _id: { $in: rest } });
      console.log(`Deleted ${rest.length} duplicates for ${doc._id.user}`);
    }

    // Add viewCount to existing documents
    await History.updateMany(
      { viewCount: { $exists: false } },
      { $set: { viewCount: 1 } }
    );

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateHistory(); 