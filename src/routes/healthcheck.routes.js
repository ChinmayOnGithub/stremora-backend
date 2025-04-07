import express from 'express';
import { getHealthCheck, getReadinessCheck } from '../controllers/healthcheck.controller.js';

const router = express.Router();
// /api/v1/healthcheck/test

// Main health check endpoint
router.get('/', getHealthCheck);

// Readiness probe
router.get('/readiness', getReadinessCheck);

export default router