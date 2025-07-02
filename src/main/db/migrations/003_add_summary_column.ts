/**
 * Migration 003: Add summary column to Briefings table
 * Adds summary_json column to store executive summary data
 */

import { Database } from 'better-sqlite3';

export function up(db: Database): void {
  // Add summary_json column to Briefings table
  db.exec(`
    ALTER TABLE Briefings 
    ADD COLUMN summary_json TEXT;
  `);
}

export function down(): void {
  // SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
  // For now, we'll leave this empty as downward migrations are rare
  console.warn('Migration 003 down: SQLite does not support DROP COLUMN');
}
