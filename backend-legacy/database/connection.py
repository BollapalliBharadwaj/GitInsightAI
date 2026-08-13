"""
Async SQLite database connection and lifecycle management.
Uses aiosqlite for non-blocking database operations.
"""

import aiosqlite
from pathlib import Path
from loguru import logger

# Database file path (relative to where the server is launched)
DB_PATH = Path("gitinsight.db")

# Global connection reference managed by app lifespan
_db_connection: aiosqlite.Connection | None = None


async def init_database():
    """
    Initialize the database connection and create tables.
    Called once during app startup via FastAPI lifespan.
    """
    global _db_connection
    logger.info(f"Connecting to database at {DB_PATH.absolute()}")

    _db_connection = await aiosqlite.connect(str(DB_PATH))
    # Enable WAL mode for better concurrent read performance
    await _db_connection.execute("PRAGMA journal_mode=WAL")
    # Return rows as dict-like objects
    _db_connection.row_factory = aiosqlite.Row

    await _create_tables(_db_connection)
    logger.info("Database ready")


async def _create_tables(db: aiosqlite.Connection):
    """
    Create application tables if they don't exist.
    Idempotent — safe to call on every startup.
    """
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS repositories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL UNIQUE,
            owner TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            stars INTEGER DEFAULT 0,
            forks INTEGER DEFAULT 0,
            language TEXT,
            url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repository_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            overall_score REAL,
            summary TEXT,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (repository_id) REFERENCES repositories(id)
        );

        CREATE TABLE IF NOT EXISTS agent_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id INTEGER NOT NULL,
            agent_name TEXT NOT NULL,
            score REAL,
            findings TEXT,
            recommendations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id)
        );
    """)
    await db.commit()
    logger.info("Database tables verified")


async def get_database() -> aiosqlite.Connection:
    """
    Provides the database connection to route handlers via dependency injection.
    Raises RuntimeError if called before init_database().
    """
    if _db_connection is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _db_connection


async def close_database():
    """
    Gracefully close the database connection.
    Called during app shutdown via FastAPI lifespan.
    """
    global _db_connection
    if _db_connection:
        await _db_connection.close()
        _db_connection = None
        logger.info("Database connection closed")
