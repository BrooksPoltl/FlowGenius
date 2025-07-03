/**
 * Migration 005: Add user_settings table
 * Creates a table to store user preferences for scheduling and notifications
 */

import { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🔄 Running migration 005: Add user_settings table');

  try {
    // Create user_settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS UserSettings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default settings
    const defaultSettings = [
      { key: 'schedule_morning_enabled', value: 'true' },
      { key: 'schedule_morning_time', value: '08:00' },
      { key: 'schedule_evening_enabled', value: 'true' },
      { key: 'schedule_evening_time', value: '18:00' },
      { key: 'notifications_enabled', value: 'true' },
    ];

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO UserSettings (key, value) 
      VALUES (?, ?)
    `);

    for (const setting of defaultSettings) {
      insertStmt.run(setting.key, setting.value);
    }

    console.log('✅ Migration 005 completed successfully');
  } catch (error) {
    console.error('❌ Migration 005 failed:', error);
    throw error;
  }
}

export function down(db: Database): void {
  console.log('🔄 Rolling back migration 005: Add user_settings table');

  try {
    db.exec('DROP TABLE IF EXISTS UserSettings;');
    console.log('✅ Migration 005 rollback completed successfully');
  } catch (error) {
    console.error('❌ Migration 005 rollback failed:', error);
    throw error;
  }
}
