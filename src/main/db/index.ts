/**
 * Database connection singleton for the News Curator feature
 * Initializes SQLite database and creates necessary tables
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';
import { CREATE_ARTICLES_TABLE, CREATE_INTERESTS_TABLE } from './schema';

const dbPath = path.join(app.getPath('userData'), 'app_database.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(CREATE_INTERESTS_TABLE);
db.exec(CREATE_ARTICLES_TABLE);

// Run migrations to add missing columns if they don't exist
runMigrations();

console.log('Database initialized at:', dbPath);

/**
 * Runs database migrations to update schema
 */
function runMigrations(): void {
  try {
    // Check if source column exists, if not add it
    const columns = db.pragma('table_info(Articles)') as Array<{
      name: string;
    }>;
    const columnNames = columns.map(col => col.name);

    if (!columnNames.includes('source')) {
      db.exec('ALTER TABLE Articles ADD COLUMN source TEXT');
      console.log('Added source column to Articles table');
    }

    if (!columnNames.includes('thumbnail_url')) {
      db.exec('ALTER TABLE Articles ADD COLUMN thumbnail_url TEXT');
      console.log('Added thumbnail_url column to Articles table');
    }

    if (!columnNames.includes('fetched_at')) {
      db.exec(
        'ALTER TABLE Articles ADD COLUMN fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      );
      console.log('Added fetched_at column to Articles table');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

export default db;
