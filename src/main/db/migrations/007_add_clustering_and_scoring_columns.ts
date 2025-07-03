/**
 * Migration 007: Add clustering and scoring columns to Articles table
 * Adds cluster_id and significance_score columns to support the unified article pipeline
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log(
    'Running migration 007: Adding clustering and scoring columns to Articles table'
  );

  // Add cluster_id column to group related articles
  db.exec(`
    ALTER TABLE Articles 
    ADD COLUMN cluster_id TEXT;
  `);

  // Add significance_score column to store AI-generated news significance
  db.exec(`
    ALTER TABLE Articles 
    ADD COLUMN significance_score REAL DEFAULT 0.0;
  `);

  // Add interest_score column to store final combined score
  db.exec(`
    ALTER TABLE Articles 
    ADD COLUMN interest_score REAL DEFAULT 0.0;
  `);

  console.log('Migration 007 completed successfully');
}

export function down(db: Database): void {
  console.log(
    'Rolling back migration 007: Removing clustering and scoring columns from Articles table'
  );

  // Remove the added columns
  db.exec(`
    ALTER TABLE Articles 
    DROP COLUMN cluster_id;
  `);

  db.exec(`
    ALTER TABLE Articles 
    DROP COLUMN significance_score;
  `);

  db.exec(`
    ALTER TABLE Articles 
    DROP COLUMN interest_score;
  `);

  console.log('Migration 007 rollback completed');
}
