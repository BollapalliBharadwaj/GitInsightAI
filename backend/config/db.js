import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { config } from './env.js';
import logger from '../utils/logger.js';

let dbInstance = null;

export const connectDB = async () => {
  if (dbInstance) return dbInstance;
  
  try {
    const dbPath = config.db.file;
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    logger.info(`SQLite Connected: ${dbPath}`);
    
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT UNIQUE NOT NULL,
        owner TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        stars INTEGER DEFAULT 0,
        forks INTEGER DEFAULT 0,
        language TEXT,
        url TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repositoryId INTEGER NOT NULL,
        status TEXT NOT NULL,
        overallScore INTEGER,
        summary TEXT,
        completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repositoryId) REFERENCES repositories (id)
      );
      
      CREATE TABLE IF NOT EXISTS agent_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysisId INTEGER NOT NULL,
        agentName TEXT NOT NULL,
        findings TEXT,
        FOREIGN KEY (analysisId) REFERENCES analyses (id)
      );
    `);
    
    logger.info("SQLite tables initialized successfully");
    
    return dbInstance;
  } catch (error) {
    logger.error(`Error connecting to SQLite: ${error.message}`);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }
  return dbInstance;
};
