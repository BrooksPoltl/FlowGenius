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
export async function curationAgent(state: any): Promise<any> {
  try {
    const { searchResults, searchErrors } = state;
    const articles = searchResults || [];

    // If there were search errors, pass them through
    if (searchErrors && searchErrors.length > 0) {
      return {
        curatedArticles: [],
        curationComplete: true,
        duplicatesFiltered: 0,
        newArticlesSaved: 0,
      };
    }

    if (!articles || articles.length === 0) {
      return {
        curatedArticles: [],
        curationComplete: true,
        duplicatesFiltered: 0,
        newArticlesSaved: 0,
      };
    }

    const curatedArticles: Article[] = [];
    let savedCount = 0;
    let duplicateCount = 0;

    // Check total articles before processing
    const countBefore = db
      .prepare('SELECT COUNT(*) as count FROM Articles')
      .get() as { count: number };
    console.log(
      `📊 Articles in database before processing: ${countBefore.count}`
    );
    console.log(`📊 Articles to process: ${articles.length}`);

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

        console.log(
          `🔍 Checking article: "${article.title}" - URL: ${article.url}`
        );

        // Check if article already exists
        const existing = checkExisting.get(article.url);
        console.log(`🔍 Existing check result:`, existing);

        if (existing) {
          duplicateCount++;
          console.log(`🔄 Duplicate article found: ${article.title}`);
          continue;
        }

        console.log(`✅ New article, saving: ${article.title}`);

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

    // Check total articles after processing
    const countAfter = db
      .prepare('SELECT COUNT(*) as count FROM Articles')
      .get() as { count: number };
    console.log(
      `📊 Articles in database after processing: ${countAfter.count}`
    );
    console.log(
      `📊 Expected change: +${savedCount}, Actual change: +${countAfter.count - countBefore.count}`
    );

    console.log(
      `Curation complete: ${savedCount} new articles saved, ${duplicateCount} duplicates skipped`
    );

    return {
      curatedArticles,
      curationComplete: true,
      duplicatesFiltered: duplicateCount,
      newArticlesSaved: savedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in CurationAgent';
    console.error('CurationAgent error:', errorMessage);

    return {
      curatedArticles: [],
      curationComplete: false,
      duplicatesFiltered: 0,
      newArticlesSaved: 0,
      error: errorMessage,
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
