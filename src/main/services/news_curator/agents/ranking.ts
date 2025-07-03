/**
 * RankingAgent - Calculates personalization scores for articles
 * This agent computes scores based on user's topic affinities and updates articles
 */

import db from '../../../db';
import type { WorkflowState } from '../../../../shared/types';

/**
 * RankingAgent function that calculates personalization scores for articles
 * @param state - State containing curated articles
 * @returns Updated state with ranking complete
 */
export async function rankingAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const curatedArticles = state.curatedArticles || [];

    if (curatedArticles.length === 0) {
      console.log('No articles to rank');
      return {
        ...state,
        articlesRanked: true,
        rankedCount: 0,
      };
    }

    console.log(
      `Ranking ${curatedArticles.length} articles based on topic affinities...`
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

    const updatePersonalizationScore = db.prepare(`
      UPDATE Articles 
      SET personalization_score = ?
      WHERE id = ?
    `);

    let rankedCount = 0;

    for (const article of curatedArticles) {
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

        if (topicData.length === 0) {
          // No topics extracted yet, set default score
          updatePersonalizationScore.run(0.0, articleData.id);
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

        // Update the article's personalization score
        updatePersonalizationScore.run(personalizationScore, articleData.id);
        rankedCount++;

        console.log(
          `📊 Ranked "${article.title}": ${personalizationScore.toFixed(3)} (${topicData.length} topics)`
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
