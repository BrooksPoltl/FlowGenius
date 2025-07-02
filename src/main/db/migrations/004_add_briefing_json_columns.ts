/**
 * Migration 004: Add JSON columns to Briefings table
 * Adds topics_json and articles_json columns for storing structured data
 */

import { Database } from 'better-sqlite3';

export function up(db: Database): void {
  // Check if columns already exist to avoid errors
  const tableInfo = db.pragma('table_info(Briefings)') as Array<{ name: string }>;
  const columnNames = tableInfo.map((col) => col.name);
  
  if (!columnNames.includes('topics_json')) {
    db.exec(`
      ALTER TABLE Briefings 
      ADD COLUMN topics_json TEXT;
    `);
    console.log('Added topics_json column to Briefings table');
  }
  
  if (!columnNames.includes('articles_json')) {
    db.exec(`
      ALTER TABLE Briefings 
      ADD COLUMN articles_json TEXT;
    `);
    console.log('Added articles_json column to Briefings table');
  }
  
  // Update existing briefings with empty JSON arrays if the columns were just added
  db.exec(`
    UPDATE Briefings 
    SET topics_json = '[]', articles_json = '[]' 
    WHERE topics_json IS NULL OR articles_json IS NULL;
  `);
}

export function down(): void {
  // SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
  // For now, we'll leave this empty as downward migrations are rare
  console.warn('Migration 004 down: SQLite does not support DROP COLUMN');
}

export function runMigration004(): void {
  const db = require('../../db').default;
  
  try {
    console.log('Running migration 004: Add JSON columns to Briefings table...');
    up(db);
    console.log('Migration 004: Completed successfully');
  } catch (error) {
    console.error('Migration 004: Failed -', error);
    throw error;
  }
} 