/**
 * Database schema definitions for the News Curator feature
 * Contains SQL table creation statements for storing user interests and articles
 */

export const CREATE_INTERESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS Interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL UNIQUE
  );
`;

export const CREATE_ARTICLES_TABLE = `
  CREATE TABLE IF NOT EXISTS Articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT,
    published_at TIMESTAMP,
    thumbnail_url TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
