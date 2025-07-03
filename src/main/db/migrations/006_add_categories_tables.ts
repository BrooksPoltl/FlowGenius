/**
 * Migration 006: Add categories tables and interest-category relationships
 * Creates categories table, interests_categories junction table, and category_schedules table
 */

import { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🔄 Running migration 006: Add categories tables');

  try {
    // Create categories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS Categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create interests_categories junction table for many-to-many relationship
    db.exec(`
      CREATE TABLE IF NOT EXISTS Interests_Categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interest_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (interest_id) REFERENCES Interests (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES Categories (id) ON DELETE CASCADE,
        UNIQUE(interest_id, category_id)
      );
    `);

    // Create category_schedules table for per-category scheduling
    db.exec(`
      CREATE TABLE IF NOT EXISTS Category_Schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        cron_expression TEXT NOT NULL,
        is_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES Categories (id) ON DELETE CASCADE,
        UNIQUE(category_id)
      );
    `);

    // Insert default "General" category
    db.exec(`
      INSERT OR IGNORE INTO Categories (name) VALUES ('General');
    `);

    // Get the General category ID
    const generalCategory = db
      .prepare('SELECT id FROM Categories WHERE name = ?')
      .get('General') as { id: number } | undefined;

    if (generalCategory) {
      // Assign all existing interests to the General category
      db.exec(`
        INSERT OR IGNORE INTO Interests_Categories (interest_id, category_id)
        SELECT id, ${generalCategory.id} FROM Interests;
      `);
    }

    console.log('✅ Migration 006 completed successfully');
  } catch (error) {
    console.error('❌ Migration 006 failed:', error);
    throw error;
  }
}

export function down(db: Database): void {
  console.log('🔄 Rolling back migration 006: Remove categories tables');

  try {
    db.exec('DROP TABLE IF EXISTS Category_Schedules;');
    db.exec('DROP TABLE IF EXISTS Interests_Categories;');
    db.exec('DROP TABLE IF EXISTS Categories;');

    console.log('✅ Migration 006 rollback completed successfully');
  } catch (error) {
    console.error('❌ Migration 006 rollback failed:', error);
    throw error;
  }
}
