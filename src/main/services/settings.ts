/**
 * Settings service for managing user interests and preferences
 * Handles seeding default interests and retrieving user preferences
 */

import db from '../db';

const DEFAULT_INTERESTS = [
  'Artificial Intelligence',
  'Technology',
  'Finance',
  'Software Engineering',
  'Startups',
];

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

    console.log('Default interests seeded');
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
