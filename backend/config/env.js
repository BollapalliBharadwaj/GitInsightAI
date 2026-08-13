import dotenv from 'dotenv';

dotenv.config();

export const config = {
  appName: process.env.APP_NAME || 'GitInsight AI',
  appVersion: process.env.APP_VERSION || '1.0.0',
  debug: process.env.DEBUG === 'true',
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '8000', 10),
  },
  db: {
    file: process.env.DATABASE_FILE || './data/gitinsight.db',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'qwen2.5:1.5b',
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
