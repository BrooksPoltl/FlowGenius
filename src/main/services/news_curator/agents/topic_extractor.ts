/**
 * TopicExtractorAgent - Extracts topics from articles using OpenAI
 * This agent analyzes article content and extracts relevant topics for personalization
 */

import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import db from '../../../db';

// Schema for topic extraction response
const TopicExtractionSchema = z.object({
  topics: z.array(
    z.object({
      name: z
        .string()
        .describe(
          'The topic name (e.g., "Artificial Intelligence", "Climate Change")'
        ),
      relevance: z
        .number()
        .min(0)
        .max(1)
        .describe('Relevance score between 0 and 1'),
    })
  ),
});

/**
 * TopicExtractorAgent function that extracts topics from articles using OpenAI
 * @param state - State containing articles to analyze
 * @returns Updated state with topic extraction complete
 */
export async function topicExtractorAgent(state: any): Promise<any> {
  try {
    const { curatedArticles } = state;

    if (!curatedArticles || curatedArticles.length === 0) {
      console.log('No articles to extract topics from');
      return {
        topicsExtracted: true,
      };
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not found');
    }

    console.log(`Extracting topics from ${curatedArticles.length} articles...`);

    // Initialize OpenAI model
    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      apiKey: openaiApiKey,
      temperature: 0.1, // Low temperature for consistent results
    });

    // Create structured output chain
    const structuredLlm = llm.withStructuredOutput(TopicExtractionSchema);

    // Prepare database statements
    const insertTopic = db.prepare(`
      INSERT OR IGNORE INTO Topics (name) VALUES (?)
    `);
    const getTopicId = db.prepare(`
      SELECT id FROM Topics WHERE name = ?
    `);
    const getArticleId = db.prepare(`
      SELECT id FROM Articles WHERE url = ?
    `);
    const insertArticleTopic = db.prepare(`
      INSERT OR REPLACE INTO Article_Topics (article_id, topic_id, relevance_score)
      VALUES (?, ?, ?)
    `);

    let totalTopicsExtracted = 0;

    // Process articles in batches to avoid overwhelming the API
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

        // Create prompt for topic extraction
        const prompt = `Analyze the following news article and extract the most relevant topics. Focus on:
- Main subject areas (e.g., Technology, Politics, Sports)
- Specific domains (e.g., Artificial Intelligence, Climate Change, Cryptocurrency)
- Industry sectors (e.g., Healthcare, Finance, Energy)

IMPORTANT: Only extract broad, well-known topics that would be useful for news categorization. Avoid overly specific or niche topics.

Article Title: ${article.title}
Article Description: ${article.description}
Source: ${article.source}

Extract 2-4 most relevant topics with their relevance scores.`;

        // Extract topics using OpenAI
        const response = await structuredLlm.invoke(prompt);

        // Store topics in database
        for (const topic of response.topics) {
          // Insert topic (ignore if exists)
          insertTopic.run(topic.name);

          // Get topic ID
          const topicRow = getTopicId.get(topic.name) as
            | { id: number }
            | undefined;
          if (!topicRow) {
            console.error(`Failed to get topic ID for: ${topic.name}`);
            continue;
          }

          // Link article to topic
          insertArticleTopic.run(articleId, topicRow.id, topic.relevance);
          totalTopicsExtracted++;
        }

        console.log(
          `Extracted ${response.topics.length} topics for: ${article.title}`
        );

        // Add small delay to respect rate limits
        await new Promise(resolve => {
          setTimeout(resolve, 100);
        });
      } catch (error) {
        console.error(
          `Error extracting topics for article "${article.title}":`,
          error
        );
      }
    }

    console.log(
      `Topic extraction complete: ${totalTopicsExtracted} topic associations created`
    );

    // Check total topic count and warn if getting high
    const totalTopicsStmt = db.prepare('SELECT COUNT(*) as count FROM Topics');
    const totalTopics = (totalTopicsStmt.get() as { count: number }).count;

    console.log(`Total topics in database: ${totalTopics}`);
    if (totalTopics > 500) {
      console.warn('⚠️  Topic count is getting high. Consider topic cleanup.');
    }

    return {
      topicsExtracted: true,
      topicsExtractedCount: totalTopicsExtracted,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in TopicExtractorAgent';
    console.error('TopicExtractorAgent error:', errorMessage);

    return {
      topicsExtracted: false,
      error: errorMessage,
    };
  }
}
