/**
 * Migration 002: Add search attempt tracking
 * Adds last_search_attempt_at column to track when we last searched for each interest,
 * regardless of whether new articles were found. This enables proper cool-down behavior
 * even when all results are duplicates.
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🔄 Running migration 002: Add search attempt tracking');

  try {
    // Add the new column
    db.exec(`
      ALTER TABLE Interests 
      ADD COLUMN last_search_attempt_at TIMESTAMP;
    `);

    console.log('✅ Migration 002 completed successfully');
  } catch (error) {
    console.error('❌ Migration 002 failed:', error);
    throw error;
  }
}

export function down(db: Database): void {
  console.log('🔄 Rolling back migration 002: Add search attempt tracking');

  try {
    // Remove the column (SQLite doesn't support DROP COLUMN directly)
    // We'll need to recreate the table without the column
    db.exec(`
      CREATE TABLE Interests_backup AS SELECT 
        id, name, created_at, last_new_article_at, discovery_count, avg_discovery_interval_seconds
      FROM Interests;
      
      DROP TABLE Interests;
      
      CREATE TABLE Interests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_new_article_at TIMESTAMP,
        discovery_count INTEGER DEFAULT 0,
        avg_discovery_interval_seconds REAL DEFAULT 0.0
      );
      
      INSERT INTO Interests SELECT * FROM Interests_backup;
      DROP TABLE Interests_backup;
    `);

    console.log('✅ Migration 002 rollback completed successfully');
  } catch (error) {
    console.error('❌ Migration 002 rollback failed:', error);
    throw error;
  }
}
