// checks if the health of the server is ok i guess

import mongoose from "mongoose";

export const getHealthCheck = async (req, res) => {
    try {
        const dbReady = await checkDatabaseConnection();

        res.status(200).json({
            status: dbReady ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version,
            uptime: process.uptime(),
            dependencies: {
                database: dbReady
            }
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            error: 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
};

export const getReadinessCheck = async (req, res) => {
    try {
        const dbReady = await checkDatabaseConnection();
        if (!dbReady) throw new Error('Database not available');

        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch {
        res.status(503).json({
            status: 'not_ready',
            error: 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
};

const checkDatabaseConnection = async () => {
    try {
        await mongoose.connection.db.admin().ping();
        return true;
    } catch (error) {
        return false;
    }
};