/**
 * Migration 001: Add Interest Discovery Tracking Columns
 * Adds columns to track discovery intervals for smart cool-down feature
 */

import db from '../index';

export function runMigration001(): void {
  try {
    console.log(
      'Running migration 001: Add interest discovery tracking columns...'
    );

    // Check if migration is needed by checking if columns exist
    const tableInfo = db
      .prepare('PRAGMA table_info(Interests)')
      .all() as Array<{
      name: string;
      type: string;
    }>;

    const hasLastNewArticleAt = tableInfo.some(
      col => col.name === 'last_new_article_at'
    );
    const hasDiscoveryCount = tableInfo.some(
      col => col.name === 'discovery_count'
    );
    const hasAvgDiscoveryInterval = tableInfo.some(
      col => col.name === 'avg_discovery_interval_seconds'
    );

    if (hasLastNewArticleAt && hasDiscoveryCount && hasAvgDiscoveryInterval) {
      console.log('Migration 001: Columns already exist, skipping...');
      return;
    }

    // Add new columns to Interests table
    if (!hasLastNewArticleAt) {
      db.prepare(
        'ALTER TABLE Interests ADD COLUMN last_new_article_at TIMESTAMP'
      ).run();
      console.log('Added last_new_article_at column');
    }

    if (!hasDiscoveryCount) {
      db.prepare(
        'ALTER TABLE Interests ADD COLUMN discovery_count INTEGER DEFAULT 0'
      ).run();
      console.log('Added discovery_count column');
    }

    if (!hasAvgDiscoveryInterval) {
      db.prepare(
        'ALTER TABLE Interests ADD COLUMN avg_discovery_interval_seconds REAL DEFAULT 0.0'
      ).run();
      console.log('Added avg_discovery_interval_seconds column');
    }

    console.log('Migration 001 completed successfully');
  } catch (error) {
    console.error('Error running migration 001:', error);
    throw error;
  }
}
