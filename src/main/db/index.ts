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

console.log('Database initialized at:', dbPath);

export default db;
