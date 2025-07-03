/**
 * TopicExtractorAgent - Extracts topics from article content using AI
 * This agent analyzes article content and identifies relevant topics for personalization
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import db from '../../../db';
import type { WorkflowState } from '../../../../shared/types';

/**
 * Interface for topic extraction result
 */
interface TopicExtractionResult {
  topics: Array<{
    name: string;
    relevance: number; // 0-1 score
  }>;
}

/**
 * TopicExtractorAgent function that extracts topics from curated articles
 * @param state - State containing curated articles
 * @returns Updated state with topics extracted
 */
export async function topicExtractorAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const curatedArticles = state.curatedArticles || [];

    if (curatedArticles.length === 0) {
      console.log('No articles to extract topics from');
      return {
        ...state,
        topicsExtracted: true,
        topicsExtractedCount: 0,
      };
    }

    console.log(
      `🏷️ Extracting topics from ${curatedArticles.length} articles...`
    );

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 500,
    });

    const prompt = PromptTemplate.fromTemplate(`
You are a topic extraction expert. Given an article title and description, extract 3-5 relevant topics that best describe the content.

Article:
Title: {title}
Description: {description}

Return topics as a JSON array with format:
[
  {{"name": "Topic Name", "relevance": 0.9}},
  {{"name": "Another Topic", "relevance": 0.7}}
]

Topics should be:
- Specific and descriptive
- Relevant to the article content
- Useful for personalization
- Scored 0-1 for relevance to the article

Only return the JSON array, no other text.
`);

    let totalTopicsExtracted = 0;

    // Prepare database statements
    const getArticleId = db.prepare('SELECT id FROM Articles WHERE url = ?');
    const insertTopic = db.prepare(`
      INSERT OR IGNORE INTO Topics (name, created_at) 
      VALUES (?, datetime('now'))
    `);
    const getTopicId = db.prepare('SELECT id FROM Topics WHERE name = ?');
    const insertArticleTopic = db.prepare(`
      INSERT OR REPLACE INTO Article_Topics (article_id, topic_id, relevance_score, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);

    // Process each article
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

        // Extract topics using AI
        const response = await llm.invoke(
          await prompt.format({
            title: article.title,
            description: article.description || '',
          })
        );

        // Parse AI response
        let extractionResult: TopicExtractionResult;
        try {
          const content = response.content as string;
          const topics = JSON.parse(content);
          extractionResult = { topics };
        } catch (parseError) {
          console.warn(
            `Failed to parse AI response for article "${article.title}":`,
            parseError
          );
          continue;
        }

        // Store topics in database
        for (const topic of extractionResult.topics) {
          try {
            // Insert topic (ignore if exists)
            insertTopic.run(topic.name);

            // Get topic ID
            const topicData = getTopicId.get(topic.name) as
              | { id: number }
              | undefined;
            if (!topicData) {
              console.warn(`Failed to get topic ID for: ${topic.name}`);
              continue;
            }

            // Link article to topic with relevance score
            insertArticleTopic.run(
              articleData.id,
              topicData.id,
              topic.relevance
            );

            totalTopicsExtracted++;
          } catch (topicError) {
            console.error(`Error storing topic "${topic.name}":`, topicError);
          }
        }

        console.log(
          `🏷️ Extracted ${extractionResult.topics.length} topics for "${article.title}"`
        );
      } catch (error) {
        console.error(
          `Error extracting topics for article "${article.title}":`,
          error
        );
      }
    }

    console.log(
      `✅ Topic extraction complete: ${totalTopicsExtracted} topics extracted`
    );

    return {
      ...state,
      topicsExtracted: true,
      topicsExtractedCount: totalTopicsExtracted,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('TopicExtractorAgent error:', errorMessage);

    return {
      ...state,
      topicsExtracted: false,
      topicsExtractedCount: 0,
      error: errorMessage,
    };
  }
}
