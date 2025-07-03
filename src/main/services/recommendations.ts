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
 * @returns Array of top 3 recommended topics not already in user's interests
 */
export function getTopicRecommendations(): TopicRecommendation[] {
  try {
    console.log('Generating top 3 topic recommendations...');

    // First, let's check what data we have for debugging
    const totalTopics = db.prepare('SELECT COUNT(*) as count FROM Topics').get() as { count: number };
    const totalAffinities = db.prepare('SELECT COUNT(*) as count FROM TopicAffinities').get() as { count: number };
    const totalInterests = db.prepare('SELECT COUNT(*) as count FROM Interests').get() as { count: number };
    
    console.log(`Debug: ${totalTopics.count} topics, ${totalAffinities.count} affinities, ${totalInterests.count} interests`);

    // Just get any topics that aren't already interests
    const stmt = db.prepare(`
      SELECT 
        t.id as topicId,
        t.name as topicName,
        COALESCE(ta.affinity_score, 0.1) as affinityScore,
        COALESCE(ta.interaction_count, 0) as interactionCount
      FROM Topics t
      LEFT JOIN TopicAffinities ta ON t.id = ta.topic_id
      WHERE t.name NOT IN (
        SELECT name FROM Interests
      )
      ORDER BY COALESCE(ta.affinity_score, 0.1) DESC, t.name ASC
      LIMIT 3
    `);

    const recommendations = stmt.all() as TopicRecommendation[];

    console.log(`Found ${recommendations.length} topic recommendations`);
    
    // Log the recommendations for debugging
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.topicName} (affinity: ${rec.affinityScore.toFixed(3)}, interactions: ${rec.interactionCount})`);
    });

    return recommendations;
  } catch (error) {
    console.error('Error generating topic recommendations:', error);
    return [];
  }
}
