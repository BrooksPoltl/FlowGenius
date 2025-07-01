/**
 * CurationAgent - Handles deduplication and storage of news articles
 * This agent receives articles from SearchAgent and manages the database
 */

import db from '../../../db';
import { SearchState, Article } from './search';

export interface CurationState extends SearchState {
  curatedArticles: Article[];
  savedCount: number;
  duplicateCount: number;
}

/**
 * CurationAgent function that deduplicates and stores articles
 * @param state - State containing articles from SearchAgent
 * @returns Updated state with curated articles
 */
export async function curationAgent(
  state: SearchState
): Promise<CurationState> {
  try {
    const { articles, searchErrors } = state;

    // If there were search errors, pass them through
    if (searchErrors && searchErrors.length > 0) {
      return {
        ...state,
        curatedArticles: [],
        savedCount: 0,
        duplicateCount: 0,
      };
    }

    if (articles.length === 0) {
      return {
        ...state,
        curatedArticles: [],
        savedCount: 0,
        duplicateCount: 0,
      };
    }

    const curatedArticles: Article[] = [];
    let savedCount = 0;
    let duplicateCount = 0;

    // Prepare database statements
    const checkExisting = db.prepare('SELECT id FROM Articles WHERE url = ?');
    const insertArticle = db.prepare(`
      INSERT INTO Articles (title, url, description, source, published_at, thumbnail_url, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    // Process each article
    for (const article of articles) {
      try {
        // Skip articles without URLs
        if (!article.url) {
          console.warn('Skipping article without URL:', article.title);
          continue;
        }

        // Check if article already exists
        const existing = checkExisting.get(article.url);

        if (existing) {
          duplicateCount++;
          console.log(`Duplicate article found: ${article.title}`);
          continue;
        }

        // Save new article to database
        insertArticle.run(
          article.title,
          article.url,
          article.description,
          article.source,
          article.published_at || null,
          article.thumbnail || null
        );

        curatedArticles.push(article);
        savedCount++;
      } catch (error) {
        console.error(`Error processing article "${article.title}":`, error);
      }
    }

    console.log(
      `Curation complete: ${savedCount} new articles saved, ${duplicateCount} duplicates skipped`
    );

    return {
      ...state,
      curatedArticles,
      savedCount,
      duplicateCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in CurationAgent';
    console.error('CurationAgent error:', errorMessage);

    return {
      ...state,
      curatedArticles: [],
      savedCount: 0,
      duplicateCount: 0,
      searchErrors: [...(state.searchErrors || []), errorMessage],
    };
  }
}

/**
 * Retrieves recent articles from the database
 * @param limit - Maximum number of articles to retrieve
 * @returns Array of articles from database
 */
export function getRecentArticles(limit: number = 20): Article[] {
  try {
    const query = db.prepare(`
      SELECT title, url, description, source, published_at, thumbnail_url
      FROM Articles 
      ORDER BY fetched_at DESC 
      LIMIT ?
    `);

    const rows = query.all(limit) as Record<string, any>[];

    return rows.map(row => ({
      title: row.title,
      url: row.url,
      description: row.description,
      source: row.source,
      published_at: row.published_at,
      thumbnail: row.thumbnail_url,
    }));
  } catch (error) {
    console.error('Error retrieving recent articles:', error);
    return [];
  }
}
