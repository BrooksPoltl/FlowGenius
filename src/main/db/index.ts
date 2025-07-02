/**
 * Database connection singleton for the News Curator feature
 * Initializes SQLite database and creates necessary tables
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import {
  CREATE_INTERESTS_TABLE,
  CREATE_ARTICLES_TABLE,
  CREATE_TOPICS_TABLE,
  CREATE_ARTICLE_TOPICS_TABLE,
  CREATE_TOPIC_AFFINITIES_TABLE,
  CREATE_INTERACTIONS_TABLE,
  CREATE_BRIEFINGS_TABLE,
  CREATE_BRIEFING_ARTICLES_TABLE,
  CREATE_WORKFLOW_RUNS_TABLE,
} from './schema';
import { up as migration003Up } from './migrations/003_add_summary_column';
import { up as migration004Up } from './migrations/004_add_briefing_json_columns';

// Get the path to the user data directory
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'app_database.db');

console.log('Database path:', dbPath);

// Create the database connection
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(CREATE_INTERESTS_TABLE);
db.exec(CREATE_ARTICLES_TABLE);
db.exec(CREATE_TOPICS_TABLE);
db.exec(CREATE_ARTICLE_TOPICS_TABLE);
db.exec(CREATE_TOPIC_AFFINITIES_TABLE);
db.exec(CREATE_INTERACTIONS_TABLE);
db.exec(CREATE_BRIEFINGS_TABLE);
db.exec(CREATE_BRIEFING_ARTICLES_TABLE);
db.exec(CREATE_WORKFLOW_RUNS_TABLE);

// Run migrations to add missing columns if they don't exist
runMigrations(db);

console.log('Database initialized at:', dbPath);

/**
 * Runs database migrations to update schema
 */
function runMigrations(db: DatabaseType): void {
  try {
    // Check if personalization_score column exists, if not add it
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
      db.exec('ALTER TABLE Articles ADD COLUMN fetched_at TIMESTAMP');
      console.log('Added fetched_at column to Articles table');
    }

    if (!columnNames.includes('personalization_score')) {
      db.exec(
        'ALTER TABLE Articles ADD COLUMN personalization_score REAL DEFAULT 0.0'
      );
      console.log('Added personalization_score column to Articles table');
    }

    // Check if Interests table needs to be updated (topic -> name)
    const interestsColumns = db.pragma('table_info(Interests)') as Array<{
      name: string;
    }>;
    const interestsColumnNames = interestsColumns.map(col => col.name);

    if (
      interestsColumnNames.includes('topic') &&
      !interestsColumnNames.includes('name')
    ) {
      // Rename topic column to name
      db.exec(`
        ALTER TABLE Interests RENAME COLUMN topic TO name;
      `);
      console.log('Renamed topic column to name in Interests table');
    }

    if (!interestsColumnNames.includes('created_at')) {
      db.exec('ALTER TABLE Interests ADD COLUMN created_at TIMESTAMP');
      console.log('Added created_at column to Interests table');
    }

    // Migration 002: Add search attempt tracking
    if (!interestsColumnNames.includes('last_search_attempt_at')) {
      db.exec(
        'ALTER TABLE Interests ADD COLUMN last_search_attempt_at TIMESTAMP'
      );
      console.log('Added last_search_attempt_at column to Interests table');
    }

    // Migration 003: Add summary column to Briefings
    const summaryColumnExists = db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM pragma_table_info('Briefings') 
      WHERE name = 'summary_json'
    `
      )
      .get() as { count: number };

    if (summaryColumnExists.count === 0) {
      console.log('Running migration 003: Add summary column to Briefings...');
      migration003Up(db);
      console.log('Migration 003 completed');
    }

    // Migration 004: Add JSON columns to Briefings
    const briefingsColumns = db.pragma('table_info(Briefings)') as Array<{
      name: string;
    }>;
    const briefingsColumnNames = briefingsColumns.map(col => col.name);

    if (!briefingsColumnNames.includes('topics_json') || !briefingsColumnNames.includes('articles_json')) {
      console.log('Running migration 004: Add JSON columns to Briefings...');
      migration004Up(db);
      console.log('Migration 004 completed');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

export default db;
