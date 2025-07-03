/**
 * DatabaseWriterAgent: Saves executive summaries to database
 * Handles atomic writes to ensure data consistency
 */

import db from '../../../db';
import { Briefing, Article, ExecutiveSummary } from '../../../../shared/types';

// Remove local interfaces - using shared types instead

/**
 * Database writer agent function for LangGraph integration
 * Creates a new briefing and saves all data atomically
 */
export async function databaseWriterAgent(state: {
  clusteredArticles: Article[];
  executiveSummary: ExecutiveSummary;
  summarizationComplete: boolean;
  userInterests: string[];
}): Promise<{
  briefingId: number;
  briefingSaved: boolean;
}> {
  console.log('💾 DatabaseWriterAgent: Starting database write operations');

  try {
    // Generate briefing title
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const title = `Daily Briefing - ${date}`;

    // Start transaction for atomic operations
    const transaction = db.transaction(() => {
      // Create new briefing
      const createBriefing = db.prepare(`
        INSERT INTO Briefings (title, topics_json, articles_json, summary_json)
        VALUES (?, ?, ?, ?)
      `);

      const briefingResult = createBriefing.run(
        title,
        JSON.stringify(state.userInterests),
        JSON.stringify(state.clusteredArticles),
        JSON.stringify(state.executiveSummary)
      );

      const briefingId = briefingResult.lastInsertRowid as number;

      // Update articles with new scoring fields if they exist in database
      const updateArticleScores = db.prepare(`
        UPDATE Articles 
        SET cluster_id = ?, significance_score = ?, interest_score = ?
        WHERE url = ?
      `);

      let articlesUpdated = 0;
      state.clusteredArticles.forEach(article => {
        try {
          const result = updateArticleScores.run(
            article.cluster_id || null,
            article.significance_score || 0.0,
            article.interest_score || 0.0,
            article.url
          );
          if (result.changes > 0) {
            articlesUpdated++;
          }
        } catch (error) {
          console.warn(
            `Failed to update article scores for ${article.url}:`,
            error
          );
        }
      });

      console.log(
        `💾 DatabaseWriterAgent: Updated scores for ${articlesUpdated} articles`
      );

      return briefingId;
    });

    const briefingId = transaction();

    console.log(
      `💾 DatabaseWriterAgent: Created briefing ${briefingId} with ${state.clusteredArticles.length} articles`
    );
    console.log(
      `💾 DatabaseWriterAgent: Summary includes ${state.executiveSummary.mainStories.length} main stories and ${state.executiveSummary.quickBites.length} quick bites`
    );

    return {
      briefingId,
      briefingSaved: true,
    };
  } catch (error) {
    console.error('💾 DatabaseWriterAgent: Error saving briefing:', error);
    throw error;
  }
}

/**
 * Saves executive summaries and related data to database
 * Ensures atomic operations for data consistency
 */
export class DatabaseWriterAgent {
  /**
   * Save executive summary to existing briefing
   * Updates the briefing with summary_json data
   */
  static async saveSummaryToBriefing(
    briefingId: number,
    summary: ExecutiveSummary
  ): Promise<void> {
    try {
      // Start transaction
      const transaction = db.transaction(() => {
        // Update briefing with summary data
        const updateBriefing = db.prepare(`
          UPDATE Briefings 
          SET summary_json = ?
          WHERE id = ?
        `);

        updateBriefing.run(JSON.stringify(summary), briefingId);
      });

      transaction();

      console.log(`Executive summary saved to briefing ${briefingId}`);
    } catch (error) {
      console.error('Error saving executive summary:', error);
      throw error;
    }
  }

  /**
   * Get briefing with summary data
   */
  static getBriefingWithSummary(briefingId: number): Briefing | null {
    const stmt = db.prepare(`
      SELECT * FROM Briefings WHERE id = ?
    `);

    const briefing = stmt.get(briefingId) as Briefing | undefined;
    return briefing || null;
  }

  /**
   * Check if briefing already has a summary
   */
  static briefingHasSummary(briefingId: number): boolean {
    const stmt = db.prepare(`
      SELECT summary_json FROM Briefings WHERE id = ?
    `);

    const result = stmt.get(briefingId) as
      | { summary_json?: string }
      | undefined;
    return !!result?.summary_json;
  }

  /**
   * Get all briefings with summaries for history view
   */
  static getBriefingsWithSummaries(limit: number = 10): Briefing[] {
    const stmt = db.prepare(`
      SELECT * FROM Briefings 
      WHERE summary_json IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    return stmt.all(limit) as Briefing[];
  }

  /**
   * Parse summary JSON from briefing
   */
  static parseSummaryFromBriefing(briefing: Briefing): ExecutiveSummary | null {
    if (!briefing.summary_json) return null;

    try {
      return JSON.parse(briefing.summary_json) as ExecutiveSummary;
    } catch (error) {
      console.error('Error parsing summary JSON:', error);
      return null;
    }
  }

  /**
   * Clean up old briefings to prevent database bloat
   * Keeps last 30 briefings, removes older ones
   */
  static async cleanupOldBriefings(): Promise<void> {
    try {
      const transaction = db.transaction(() => {
        // Keep last 30 briefings
        const cleanup = db.prepare(`
          DELETE FROM Briefings 
          WHERE id NOT IN (
            SELECT id FROM Briefings 
            ORDER BY created_at DESC 
            LIMIT 30
          )
        `);

        const result = cleanup.run();
        console.log(`Cleaned up ${result.changes} old briefings`);
      });

      transaction();
    } catch (error) {
      console.error('Error cleaning up old briefings:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics for analytics
   */
  static getSummaryStats(): {
    totalBriefings: number;
    briefingsWithSummaries: number;
    averageMainStories: number;
    averageQuickBites: number;
  } {
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM Briefings`);
    const summaryStmt = db.prepare(
      `SELECT COUNT(*) as count FROM Briefings WHERE summary_json IS NOT NULL`
    );
    const summariesStmt = db.prepare(
      `SELECT summary_json FROM Briefings WHERE summary_json IS NOT NULL`
    );

    const totalBriefings = (totalStmt.get() as { count: number }).count;
    const briefingsWithSummaries = (summaryStmt.get() as { count: number })
      .count;

    let totalMainStories = 0;
    let totalQuickBites = 0;
    let validSummaries = 0;

    const summaries = summariesStmt.all() as { summary_json: string }[];

    summaries.forEach(row => {
      try {
        const summary = JSON.parse(row.summary_json) as ExecutiveSummary;
        totalMainStories += summary.mainStories?.length || 0;
        totalQuickBites += summary.quickBites?.length || 0;
        validSummaries++;
      } catch (error) {
        // Skip invalid JSON
      }
    });

    return {
      totalBriefings,
      briefingsWithSummaries,
      averageMainStories:
        validSummaries > 0 ? totalMainStories / validSummaries : 0,
      averageQuickBites:
        validSummaries > 0 ? totalQuickBites / validSummaries : 0,
    };
  }
}
