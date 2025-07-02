/**
 * Database Schema Definitions for FlowGenius
 * Contains all table creation statements and schema definitions
 */

export const CREATE_INTERESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS Interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_new_article_at TIMESTAMP,
    discovery_count INTEGER DEFAULT 0,
    avg_discovery_interval_seconds REAL DEFAULT 0.0,
    last_search_attempt_at TIMESTAMP
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    topics_json TEXT NOT NULL,
    articles_json TEXT NOT NULL,
    summary_json TEXT
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

export const CREATE_WORKFLOW_RUNS_TABLE = `
  CREATE TABLE IF NOT EXISTS WorkflowRuns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interests_count INTEGER DEFAULT 0,
    search_results_count INTEGER DEFAULT 0,
    curated_articles_count INTEGER DEFAULT 0,
    duplicates_filtered_count INTEGER DEFAULT 0,
    new_articles_saved_count INTEGER DEFAULT 0,
    topics_extracted_count INTEGER DEFAULT 0,
    articles_ranked_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER
  );
`;

export const CREATE_USER_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS UserSettings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export interface Interest {
  id: number;
  name: string;
  created_at: string;
  last_new_article_at: string | null;
  discovery_count: number;
  avg_discovery_interval_seconds: number;
  last_search_attempt_at: string | null;
}

export interface Briefing {
  id: number;
  created_at: string;
  topics_json: string; // JSON array of topic strings
  articles_json: string; // JSON array of Article objects
  summary_json?: string; // JSON object containing executive summary
}

export interface UserSetting {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}
