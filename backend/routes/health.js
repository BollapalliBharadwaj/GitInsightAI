import express from 'express';
import os from 'os';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'gitinsight-api',
    system: {
      uptime: process.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      freemem: os.freemem(),
      totalmem: os.totalmem()
    }
  });
});

export default router;
