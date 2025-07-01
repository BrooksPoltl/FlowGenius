/**
 * Database Schema Definitions for FlowGenius
 * Contains all table creation statements and schema definitions
 */

export const CREATE_INTERESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS Interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    personalization_score REAL DEFAULT 0.0
  );
`;

export const CREATE_TOPICS_TABLE = `
  CREATE TABLE IF NOT EXISTS Topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_ARTICLE_TOPICS_TABLE = `
  CREATE TABLE IF NOT EXISTS Article_Topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    relevance_score REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES Articles (id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES Topics (id) ON DELETE CASCADE,
    UNIQUE(article_id, topic_id)
  );
`;

export const CREATE_TOPIC_AFFINITIES_TABLE = `
  CREATE TABLE IF NOT EXISTS TopicAffinities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    affinity_score REAL DEFAULT 0.0,
    interaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES Topics (id) ON DELETE CASCADE,
    UNIQUE(topic_id)
  );
`;

export const CREATE_INTERACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS Interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('click', 'like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES Articles (id) ON DELETE CASCADE
  );
`;

export const CREATE_BRIEFINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS Briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_BRIEFING_ARTICLES_TABLE = `
  CREATE TABLE IF NOT EXISTS Briefing_Articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    briefing_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (briefing_id) REFERENCES Briefings (id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES Articles (id) ON DELETE CASCADE
  );
`;
