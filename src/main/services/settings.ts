/**
 * Settings Service - Manages user interests and preferences
 * Handles CRUD operations for user interests stored in the database
 */

import db from '../db';
import { runMigration001 } from '../db/migrations/001_add_interest_discovery_tracking';
import { ensureDefaultCategory } from './categories';

/**
 * Initializes default settings and seeds default interests if none exist
 */
export function initializeSettings(): void {
  try {
    // Run database migrations first
    runMigration001();

    // Ensure default category exists and assign unassigned interests
    ensureDefaultCategory();

    const existingInterests = getUserInterests();

    if (existingInterests.length === 0) {
      console.log('No interests found. Seeding default interests...');

      const defaultInterests = [
        'Artificial Intelligence',
        'Technology',
        'Finance',
        'Software Engineering',
        'Startups',
        'Healthcare',
        'Space Technology',
      ];

      const insertStmt = db.prepare(
        "INSERT INTO Interests (name, created_at) VALUES (?, datetime('now'))"
      );
      const insertMany = db.transaction((interests: string[]) => {
        for (const interest of interests) {
          insertStmt.run(interest);
        }
      });

      insertMany(defaultInterests);
      console.log('Default interests seeded successfully');
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

/**
 * Retrieves all user interests from the database
 * @returns Array of interest strings
 */
export function getUserInterests(): string[] {
  try {
    const stmt = db.prepare('SELECT name FROM Interests ORDER BY name');
    const rows = stmt.all() as Array<{ name: string }>;
    return rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting user interests:', error);
    return [];
  }
}

/**
 * Adds a new interest to the database
 * @param interest - The interest to add
 * @returns boolean indicating success
 */
export function addInterest(interest: string): boolean {
  try {
    const transaction = db.transaction(() => {
      // Add the interest
      const stmt = db.prepare(
        "INSERT INTO Interests (name, created_at) VALUES (?, datetime('now'))"
      );
      const result = stmt.run(interest);
      const interestId = result.lastInsertRowid as number;

      // Assign to General category by default
      const generalCategory = db
        .prepare('SELECT id FROM Categories WHERE name = ?')
        .get('General') as { id: number } | undefined;
      if (generalCategory) {
        db.prepare(
          "INSERT INTO Interests_Categories (interest_id, category_id, created_at) VALUES (?, ?, datetime('now'))"
        ).run(interestId, generalCategory.id);
      }
    });

    transaction();
    return true;
  } catch (error) {
    console.error('Error adding interest:', error);
    return false;
  }
}

/**
 * Removes an interest from the database
 * @param interest - The interest to remove
 * @returns boolean indicating success
 */
export function deleteInterest(interest: string): boolean {
  try {
    const stmt = db.prepare('DELETE FROM Interests WHERE name = ?');
    const result = stmt.run(interest);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting interest:', error);
    return false;
  }
}
