/**
 * RankingAgent - Calculates personalization scores for articles
 * This agent computes scores based on user's topic affinities and updates articles
 */

import db from '../../../db';

/**
 * RankingAgent function that calculates personalization scores for articles
 * @param state - State containing curated articles
 * @returns Updated state with ranking complete
 */
export async function rankingAgent(state: any): Promise<any> {
  try {
    const { curatedArticles } = state;

    if (!curatedArticles || curatedArticles.length === 0) {
      console.log('No articles to rank');
      return {
        articlesRanked: true,
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

    // Process each article
    for (const article of curatedArticles) {
      try {
        // Get article ID from database
        const articleRow = getArticleId.get(article.url) as
          | { id: number }
          | undefined;
        if (!articleRow) {
          console.warn(`Article not found in database: ${article.title}`);
          continue;
        }

        const articleId = articleRow.id;

        // Get article topics with their relevance and user affinity scores
        const topics = getArticleTopics.all(articleId) as Array<{
          name: string;
          relevance_score: number;
          affinity_score: number | null;
        }>;

        if (topics.length === 0) {
          // No topics extracted for this article, set default score
          updatePersonalizationScore.run(0.0, articleId);
          continue;
        }

        // Calculate personalization score
        let totalScore = 0;
        let totalWeight = 0;

        for (const topic of topics) {
          const affinityScore = topic.affinity_score || 0; // Default to 0 if no affinity data
          const relevanceScore = topic.relevance_score;

          // Weighted score: affinity * relevance
          const weightedScore = affinityScore * relevanceScore;
          totalScore += weightedScore;
          totalWeight += relevanceScore;
        }

        // Normalize the score (average weighted by relevance)
        const personalizationScore =
          totalWeight > 0 ? totalScore / totalWeight : 0;

        // Update the article's personalization score
        updatePersonalizationScore.run(personalizationScore, articleId);
        rankedCount++;

        console.log(
          `Ranked "${article.title}": score = ${personalizationScore.toFixed(3)}`
        );
      } catch (error) {
        console.error(`Error ranking article "${article.title}":`, error);
      }
    }

    console.log(`Ranking complete: ${rankedCount} articles ranked`);

    return {
      articlesRanked: true,
      rankedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in RankingAgent';
    console.error('RankingAgent error:', errorMessage);

    return {
      articlesRanked: false,
      error: errorMessage,
    };
  }
}
