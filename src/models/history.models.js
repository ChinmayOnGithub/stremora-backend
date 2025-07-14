import mongoose, { Schema } from "mongoose";

const historySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    required: true,
    index: true
  },
  viewCount: {
    type: Number,
    default: 1
  },
  watchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  watchDuration: {
    type: Number, // in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false // true if user watched most of the video
  },
  lastPosition: {
    type: Number, // in seconds, where user left off
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate entries for same user-video combination
historySchema.index({ user: 1, video: 1 }, { unique: true });

// Method to update watch progress
historySchema.methods.updateProgress = function (position, duration) {
  this.lastPosition = position;
  this.watchDuration = duration;
  this.watchedAt = new Date();

  // Mark as completed if user watched more than 80% of the video
  if (duration > 0 && (position / duration) > 0.8) {
    this.completed = true;
  }

  return this.save();
};

const History = mongoose.model("History", historySchema);

export default History; 