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
    const interestsWithNewArticles = new Set<string>();

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

    // Prepare statements for updating interest discovery metrics
    const getInterestData = db.prepare(`
      SELECT last_new_article_at, discovery_count, avg_discovery_interval_seconds
      FROM Interests 
      WHERE name = ?
    `);

    const updateInterestMetrics = db.prepare(`
      UPDATE Interests 
      SET 
        last_new_article_at = datetime('now'),
        discovery_count = ?,
        avg_discovery_interval_seconds = ?
      WHERE name = ?
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

        // Track which interests have new articles (we'll update metrics once per interest)
        if (article.sourceInterest) {
          interestsWithNewArticles.add(article.sourceInterest);
        }
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

    // Update discovery metrics for interests that had new articles (once per interest)
    for (const interestName of interestsWithNewArticles) {
      try {
        updateInterestDiscoveryMetrics(
          interestName,
          getInterestData,
          updateInterestMetrics
        );
      } catch (error) {
        console.error(
          `Error updating discovery metrics for interest "${interestName}":`,
          error
        );
      }
    }

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
 * Updates discovery metrics for an interest when a new article is found
 * @param interestName - Name of the interest
 * @param getInterestData - Prepared statement to get current interest data
 * @param updateInterestMetrics - Prepared statement to update interest metrics
 */
function updateInterestDiscoveryMetrics(
  interestName: string,
  getInterestData: any,
  updateInterestMetrics: any
): void {
  const currentData = getInterestData.get(interestName) as
    | {
        last_new_article_at: string | null;
        discovery_count: number;
        avg_discovery_interval_seconds: number;
      }
    | undefined;

  if (!currentData) {
    console.warn(`Interest "${interestName}" not found in database`);
    return;
  }

  const currentTime = new Date();
  const newDiscoveryCount = currentData.discovery_count + 1;
  let newAvgInterval = currentData.avg_discovery_interval_seconds;

  console.log(`🔄 Updating discovery metrics for "${interestName}":`);
  console.log(`  📅 Current time: ${currentTime.toISOString()}`);
  console.log(`  📊 Previous count: ${currentData.discovery_count}`);
  console.log(`  📊 New count: ${newDiscoveryCount}`);

  // If this is not the first discovery, calculate the new average interval
  if (currentData.last_new_article_at && currentData.discovery_count > 0) {
    const lastDiscovery = new Date(currentData.last_new_article_at);
    const intervalSeconds =
      (currentTime.getTime() - lastDiscovery.getTime()) / 1000;

    console.log(`  📅 Last discovery: ${currentData.last_new_article_at}`);
    console.log(
      `  ⏱️  Interval since last: ${Math.round(intervalSeconds / 3600)}h (${intervalSeconds} seconds)`
    );
    console.log(
      `  📊 Previous avg: ${Math.round(currentData.avg_discovery_interval_seconds / 3600)}h`
    );

    // Only update average if interval is positive (avoid negative intervals from same-batch processing)
    if (intervalSeconds > 0) {
      // Calculate running average: new_avg = ((old_avg * old_count) + new_interval) / new_count
      newAvgInterval =
        (currentData.avg_discovery_interval_seconds *
          currentData.discovery_count +
          intervalSeconds) /
        newDiscoveryCount;

      console.log(
        `  📊 New avg: ${Math.round(newAvgInterval / 3600)}h (${newAvgInterval} seconds)`
      );
      console.log(
        `  🧮 Formula: ((${currentData.avg_discovery_interval_seconds} * ${currentData.discovery_count}) + ${intervalSeconds}) / ${newDiscoveryCount} = ${newAvgInterval}`
      );
    } else {
      // Keep the previous average if interval is zero/negative (same batch processing)
      newAvgInterval = currentData.avg_discovery_interval_seconds;
      console.log(
        `  ⚠️  Zero/negative interval detected (${intervalSeconds}s), keeping previous avg: ${Math.round(newAvgInterval / 3600)}h`
      );
    }
  } else {
    // First discovery, set a default interval (24 hours)
    newAvgInterval = 24 * 3600; // 24 hours in seconds
    console.log(`  🆕 First discovery, setting default avg=24h`);
  }

  // Update the database
  updateInterestMetrics.run(newDiscoveryCount, newAvgInterval, interestName);
  console.log(`  ✅ Database updated with new metrics`);
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
