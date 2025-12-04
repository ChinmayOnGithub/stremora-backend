// src/utils/logger.js
import winston from "winston";
import "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

// Ensure the logs directory exists
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Daily rotation setup
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: "stremora-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m", // Rotate when file reaches 20MB
  maxFiles: "14d", // Keep logs for 14 days
});

// Create logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`
    )
  ),
  transports: [
    dailyRotateFileTransport,
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
});

// Log to console in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
