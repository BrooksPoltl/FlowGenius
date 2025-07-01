/**
 * AffinityAgent - Updates topic affinities based on user interactions
 * This agent learns from user feedback to improve personalization
 */

import db from '../../../db';

// Interaction scoring weights
const INTERACTION_WEIGHTS = {
  like: 1.0,
  dislike: -1.0,
  click: 0.2, // Smaller positive signal
};

// Learning rate for affinity updates
const LEARNING_RATE = 0.1;

/**
 * AffinityAgent function that updates topic affinities based on user interaction
 * @param articleId - ID of the article that was interacted with
 * @param interactionType - Type of interaction ('like', 'dislike', 'click')
 * @returns Success status and updated affinities count
 */
export async function affinityAgent(
  articleId: number,
  interactionType: 'like' | 'dislike' | 'click'
): Promise<{ success: boolean; updatedAffinities: number; error?: string }> {
  try {
    console.log(
      `Processing ${interactionType} interaction for article ID: ${articleId}`
    );

    // Get interaction weight
    const interactionWeight = INTERACTION_WEIGHTS[interactionType];

    // Prepare database statements
    const getArticleTopics = db.prepare(`
      SELECT t.id, t.name, at.relevance_score
      FROM Article_Topics at
      JOIN Topics t ON at.topic_id = t.id
      WHERE at.article_id = ?
    `);

    const getTopicAffinity = db.prepare(`
      SELECT affinity_score, interaction_count
      FROM TopicAffinities
      WHERE topic_id = ?
    `);

    const insertTopicAffinity = db.prepare(`
      INSERT INTO TopicAffinities (topic_id, affinity_score, interaction_count)
      VALUES (?, ?, 1)
    `);

    const updateTopicAffinity = db.prepare(`
      UPDATE TopicAffinities
      SET affinity_score = ?, interaction_count = ?, last_updated = CURRENT_TIMESTAMP
      WHERE topic_id = ?
    `);

    // Get all topics for this article
    const articleTopics = getArticleTopics.all(articleId) as Array<{
      id: number;
      name: string;
      relevance_score: number;
    }>;

    if (articleTopics.length === 0) {
      console.warn(`No topics found for article ID: ${articleId}`);
      return { success: true, updatedAffinities: 0 };
    }

    let updatedCount = 0;

    // Update affinity for each topic
    for (const topic of articleTopics) {
      try {
        // Get current affinity data
        const currentAffinity = getTopicAffinity.get(topic.id) as
          | {
              affinity_score: number;
              interaction_count: number;
            }
          | undefined;

        // Calculate new affinity score
        let newAffinityScore: number;
        let newInteractionCount: number;

        if (currentAffinity) {
          // Update existing affinity using exponential moving average
          const currentScore = currentAffinity.affinity_score;
          const relevanceWeightedSignal =
            interactionWeight * topic.relevance_score;

          // Apply learning rate for gradual updates
          newAffinityScore =
            currentScore + LEARNING_RATE * relevanceWeightedSignal;

          // Clamp score to reasonable bounds (-2 to 2)
          newAffinityScore = Math.max(-2, Math.min(2, newAffinityScore));

          newInteractionCount = currentAffinity.interaction_count + 1;

          // Update existing affinity
          updateTopicAffinity.run(
            newAffinityScore,
            newInteractionCount,
            topic.id
          );
        } else {
          // Create new affinity entry
          newAffinityScore =
            LEARNING_RATE * interactionWeight * topic.relevance_score;
          newAffinityScore = Math.max(-2, Math.min(2, newAffinityScore));

          insertTopicAffinity.run(topic.id, newAffinityScore);
        }

        console.log(
          `Updated affinity for "${topic.name}": ${newAffinityScore.toFixed(3)} (${interactionType})`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `Error updating affinity for topic "${topic.name}":`,
          error
        );
      }
    }

    console.log(`Affinity update complete: ${updatedCount} topics updated`);

    return {
      success: true,
      updatedAffinities: updatedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in AffinityAgent';
    console.error('AffinityAgent error:', errorMessage);

    return {
      success: false,
      updatedAffinities: 0,
      error: errorMessage,
    };
  }
}

/**
 * Gets topic affinities for debugging/display purposes
 * @returns Array of topic affinities sorted by score
 */
export function getTopicAffinities(): Array<{
  topicName: string;
  affinityScore: number;
  interactionCount: number;
}> {
  try {
    const stmt = db.prepare(`
      SELECT t.name as topicName, ta.affinity_score as affinityScore, ta.interaction_count as interactionCount
      FROM TopicAffinities ta
      JOIN Topics t ON ta.topic_id = t.id
      ORDER BY ta.affinity_score DESC
    `);

    return stmt.all() as Array<{
      topicName: string;
      affinityScore: number;
      interactionCount: number;
    }>;
  } catch (error) {
    console.error('Error getting topic affinities:', error);
    return [];
  }
}
