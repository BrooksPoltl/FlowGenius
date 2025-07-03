/**
 * RankingAgent - Calculates combined interest scores for articles
 * This agent computes scores based on user's topic affinities and news significance
 */

import db from '../../../db';
import type { WorkflowState } from '../../../../shared/types';

/**
 * RankingAgent function that calculates combined interest scores for articles
 * Combines news significance score with user personalization score
 * @param state - State containing clustered articles
 * @returns Updated state with ranking complete
 */
export async function rankingAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const clusteredArticles = state.clusteredArticles || [];

    if (clusteredArticles.length === 0) {
      console.log('📊 RankingAgent: No articles to rank');
      return {
        ...state,
        articlesRanked: true,
        rankedCount: 0,
      };
    }

    console.log(
      `📊 RankingAgent: Ranking ${clusteredArticles.length} articles with combined significance + interest scoring...`
    );

    // Prepare database statements
    const getArticleId = db.prepare(`
      SELECT id FROM Articles WHERE url = ?
    `);

    const getArticleTopics = db.prepare(`
      SELECT t.name, at.relevance_score, ta.affinity_score
      FROM Article_Topics at
      JOIN Topics t ON at.topic_id = t.id
      LEFT JOIN TopicAffinities ta ON t.id = ta.topic_id
      WHERE at.article_id = ?
    `);

    const updateScores = db.prepare(`
      UPDATE Articles 
      SET personalization_score = ?, significance_score = ?, interest_score = ?
      WHERE id = ?
    `);

    let rankedCount = 0;

    for (const article of clusteredArticles) {
      try {
        // Get article ID from database
        const articleData = getArticleId.get(article.url) as
          | { id: number }
          | undefined;
        if (!articleData) {
          console.warn(`Article not found in database: ${article.url}`);
          continue;
        }

        // Get topics and their affinities for this article
        const topicData = getArticleTopics.all(articleData.id) as Array<{
          name: string;
          relevance_score: number;
          affinity_score: number | null;
        }>;

        // Get significance score from clustering (default to 0.5 if not set)
        const significanceScore = article.significance_score || 0.5;

        if (topicData.length === 0) {
          // No topics extracted yet, use significance score only
          const interestScore = significanceScore * 0.8; // Weight significance at 80% when no personalization data
          updateScores.run(
            0.0,
            significanceScore,
            interestScore,
            articleData.id
          );
          rankedCount++;
          continue;
        }

        // Calculate personalization score based on topic affinities
        let totalScore = 0;
        let totalWeight = 0;

        for (const topic of topicData) {
          const relevanceScore = topic.relevance_score || 0;
          const affinityScore = topic.affinity_score || 0;

          // Weight the affinity score by how relevant the topic is to the article
          const weightedScore = affinityScore * relevanceScore;
          totalScore += weightedScore;
          totalWeight += relevanceScore;
        }

        // Calculate final personalization score (0-1 scale)
        const personalizationScore =
          totalWeight > 0 ? totalScore / totalWeight : 0;

        // Combine significance and personalization scores
        // 60% personalization + 40% significance for balanced scoring
        const interestScore =
          personalizationScore * 0.6 + significanceScore * 0.4;

        // Update all scores in the database
        updateScores.run(
          personalizationScore,
          significanceScore,
          interestScore,
          articleData.id
        );
        rankedCount++;

        console.log(
          `📊 Ranked "${article.title}": interest=${interestScore.toFixed(3)} (personalization=${personalizationScore.toFixed(3)}, significance=${significanceScore.toFixed(3)})`
        );
      } catch (error) {
        console.error(`Error ranking article "${article.title}":`, error);
      }
    }

    console.log(`✅ Ranking complete: ${rankedCount} articles ranked`);

    return {
      ...state,
      articlesRanked: true,
      rankedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('RankingAgent error:', errorMessage);

    return {
      ...state,
      articlesRanked: false,
      rankedCount: 0,
      error: errorMessage,
    };
  }
}
