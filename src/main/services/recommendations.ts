/**
 * Recommendations Service - Generates topic recommendations based on user interactions
 * This service analyzes user's topic affinities to suggest new interests
 */

import db from '../db';

export interface TopicRecommendation {
  topicId: number;
  topicName: string;
  affinityScore: number;
  interactionCount: number;
}

/**
 * Gets topic recommendations for the user based on their interaction history
 * @returns Array of top 5 recommended topics not already in user's interests
 */
export function getTopicRecommendations(): TopicRecommendation[] {
  try {
    console.log('Generating topic recommendations...');

    // Query for topics with high affinity that aren't already interests
    const stmt = db.prepare(`
      SELECT 
        t.id as topicId,
        t.name as topicName,
        ta.affinity_score as affinityScore,
        ta.interaction_count as interactionCount
      FROM TopicAffinities ta
      JOIN Topics t ON ta.topic_id = t.id
      WHERE ta.affinity_score > 0.5 
        AND ta.interaction_count >= 3
        AND t.name NOT IN (
          SELECT name FROM Interests
        )
      ORDER BY ta.affinity_score DESC
      LIMIT 5
    `);

    const recommendations = stmt.all() as TopicRecommendation[];

    console.log(`Found ${recommendations.length} topic recommendations`);

    return recommendations;
  } catch (error) {
    console.error('Error generating topic recommendations:', error);
    return [];
  }
}
