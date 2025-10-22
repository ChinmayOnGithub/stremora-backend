// src/middlewares/log.middleware.js
import logger from "../utils/logger.js";

/**
 * Middleware to log every incoming request and its response status using Winston.
 * Automatically logs method, URL, status code, response time, and client IP.
 */
const logMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${req.ip}`;

    if (res.statusCode >= 500) logger.error(logMessage);
    else if (res.statusCode >= 400) logger.warn(logMessage);
    else logger.info(logMessage);
  });

  next();
};

export default logMiddleware;
