/**
 * Settings Service - Manages user interests and preferences
 * Handles CRUD operations for user interests stored in the database
 */

import db from '../db';

/**
 * Initializes default settings and seeds default interests if none exist
 */
export function initializeSettings(): void {
  try {
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
    const stmt = db.prepare(
      "INSERT INTO Interests (name, created_at) VALUES (?, datetime('now'))"
    );
    stmt.run(interest);
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
