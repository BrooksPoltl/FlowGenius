/**
 * CurationAgent - Handles deduplication and storage of news articles
 * This agent receives articles from SearchAgent and manages the database
 */

import db from '../../../db';
import type { WorkflowState, Article } from '../../../../shared/types';

/**
 * CurationAgent function that deduplicates and stores articles
 * @param state - State containing articles from SearchAgent
 * @returns Updated state with curated articles
 */
export async function curationAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const searchResults = state.searchResults || [];

    if (searchResults.length === 0) {
      return {
        ...state,
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
    console.log(`📊 Articles to process: ${searchResults.length}`);

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
        last_new_article_at = ?,
        discovery_count = ?,
        avg_discovery_interval_seconds = ?
      WHERE name = ?
    `);

    // Process each article
    for (const article of searchResults) {
      try {
        // Check if article already exists
        const existing = checkExisting.get(article.url);

        if (existing) {
          duplicateCount++;
          console.log(`⚠️  Duplicate article found: ${article.title}`);
          continue;
        }

        // Insert new article
        const result = insertArticle.run(
          article.title,
          article.url,
          article.description,
          article.source,
          article.publishedAt,
          article.imageUrl
        );

        if (result.changes > 0) {
          savedCount++;
          curatedArticles.push({
            ...article,
            id: result.lastInsertRowid?.toString() || article.id,
          });

          console.log(`✅ Saved new article: ${article.title}`);

          // Track which interests got new articles for metrics update
          // Note: We'd need to track sourceInterest from search results to do this properly
          // For now, we'll update all interests that were searched
          if (state.scheduledInterests) {
            state.scheduledInterests.forEach(interest => {
              interestsWithNewArticles.add(interest);
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing article ${article.title}:`, error);
      }
    }

    // Update discovery metrics for interests that got new articles
    const currentTime = new Date().toISOString();
    for (const interest of interestsWithNewArticles) {
      try {
        const interestData = getInterestData.get(interest) as
          | {
              last_new_article_at: string | null;
              discovery_count: number;
              avg_discovery_interval_seconds: number;
            }
          | undefined;

        if (interestData) {
          const newDiscoveryCount = interestData.discovery_count + 1;
          let newAvgInterval = interestData.avg_discovery_interval_seconds;

          // Calculate new average discovery interval if we have previous data
          if (interestData.last_new_article_at && newDiscoveryCount > 1) {
            const lastDiscovery = new Date(interestData.last_new_article_at);
            const currentDiscovery = new Date(currentTime);
            const intervalSeconds =
              (currentDiscovery.getTime() - lastDiscovery.getTime()) / 1000;

            // Update running average
            newAvgInterval =
              (interestData.avg_discovery_interval_seconds *
                (newDiscoveryCount - 1) +
                intervalSeconds) /
              newDiscoveryCount;
          }

          updateInterestMetrics.run(
            currentTime,
            newDiscoveryCount,
            newAvgInterval,
            interest
          );

          console.log(
            `📊 Updated metrics for "${interest}": count=${newDiscoveryCount}, avg=${Math.round(newAvgInterval / 3600)}h`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error updating metrics for interest "${interest}":`,
          error
        );
      }
    }

    // Check total articles after processing
    const countAfter = db
      .prepare('SELECT COUNT(*) as count FROM Articles')
      .get() as { count: number };

    console.log(`📊 Curation complete:`);
    console.log(`  📰 Articles processed: ${searchResults.length}`);
    console.log(`  ✅ New articles saved: ${savedCount}`);
    console.log(`  ⚠️  Duplicates filtered: ${duplicateCount}`);
    console.log(
      `  📊 Total articles in database: ${countAfter.count} (was ${countBefore.count})`
    );
    console.log(
      `  🎯 Interests with new articles: ${interestsWithNewArticles.size}`
    );

    return {
      ...state,
      curatedArticles,
      curationComplete: true,
      duplicatesFiltered: duplicateCount,
      newArticlesSaved: savedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('CurationAgent error:', errorMessage);

    return {
      ...state,
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
      SELECT id, title, url, description, source, published_at, thumbnail_url
      FROM Articles 
      ORDER BY fetched_at DESC 
      LIMIT ?
    `);

    const rows = query.all(limit) as Record<string, unknown>[];

    return rows.map(row => ({
      id: row.id as string,
      title: row.title as string,
      url: row.url as string,
      description: row.description as string,
      source: row.source as string,
      publishedAt: row.published_at as string,
      imageUrl: row.thumbnail_url as string,
      score: 0,
    }));
  } catch (error) {
    console.error('Error retrieving recent articles:', error);
    return [];
  }
}
