/**
 * Settings service for managing user interests and preferences
 * Handles initialization, seeding default interests, and CRUD operations
 */

import db from '../db';

const DEFAULT_INTERESTS = [
  'Artificial Intelligence',
  'Technology',
  'Finance',
  'Software Engineering',
  'Startups',
  'Healthcare',
  'Space Technology',
];

/**
 * Initializes the settings service and ensures default data exists
 * This should be called on app startup
 */
export function initializeSettings(): void {
  seedDefaultInterests();
}

/**
 * Seeds the database with default interests if none exist
 */
export function seedDefaultInterests(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM Interests').get() as {
    count: number;
  };

  if (count.count === 0) {
    const insertInterest = db.prepare(
      'INSERT INTO Interests (topic) VALUES (?)'
    );

    for (const topic of DEFAULT_INTERESTS) {
      insertInterest.run(topic);
    }

    console.log('Default interests seeded successfully');
  }
}

/**
 * Retrieves all user interests from the database
 * @returns Array of topic strings
 */
export function getUserInterests(): string[] {
  const interests = db.prepare('SELECT topic FROM Interests').all() as {
    topic: string;
  }[];
  return interests.map(interest => interest.topic);
}

/**
 * Adds a new interest to the database
 * @param topic - The topic to add
 * @returns boolean indicating success
 */
export function addInterest(topic: string): boolean {
  try {
    // Check if topic already exists
    const existing = db
      .prepare('SELECT id FROM Interests WHERE topic = ?')
      .get(topic);
    if (existing) {
      return false; // Topic already exists
    }

    const insertInterest = db.prepare(
      'INSERT INTO Interests (topic) VALUES (?)'
    );
    insertInterest.run(topic);
    return true;
  } catch (error) {
    console.error('Error adding interest:', error);
    return false;
  }
}

/**
 * Removes an interest from the database
 * @param topic - The topic to remove
 * @returns boolean indicating success
 */
export function deleteInterest(topic: string): boolean {
  try {
    const deleteInterest = db.prepare('DELETE FROM Interests WHERE topic = ?');
    const result = deleteInterest.run(topic);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting interest:', error);
    return false;
  }
}
