/**
 * News Curator LangGraph Implementation
 * Orchestrates the news curation workflow using LangGraph state management
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { settingsAgent } from './agents/settings';
import { interestSchedulerAgent } from './agents/scheduler';
import { searchAgent } from './agents/search';
import { curationAgent } from './agents/curation';
import { articleClusteringAgent } from './agents/clustering';
import { topicExtractorAgent } from './agents/topic_extractor';
import { rankingAgent } from './agents/ranking';
import { scraperAgent } from './agents/scraper_agent';
import { summarizerAgent } from './agents/summarizer_agent';
import { databaseWriterAgent } from './agents/database_writer';
import { NotificationAgent, NotificationState } from './agents/notification';
import {
  Article,
  ScrapedContent,
  ExecutiveSummary,
} from '../../../shared/types';
import db from '../../db';

/**
 * Workflow execution result containing metrics and data
 */
export interface WorkflowResult {
  userInterests: string[];
  searchResults: Article[];
  curatedArticles: Article[];
  clusteredArticles: Article[];
  duplicatesFiltered: number;
  newArticlesSaved: number;
  articleClustersFound: number;
  topicsExtractedCount: number;
  rankedCount: number;
  scrapingSuccessCount: number;
  briefingId: number | null;
}

// ScrapedContent interface moved to shared types

// Define the state schema using Annotation.Root()
const NewsCuratorState = Annotation.Root({
  // Settings phase
  userInterests: Annotation<string[]>({
    reducer: (current, update) => update ?? current,
  }),
  settingsLoaded: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),

  // Scheduling phase
  scheduledInterests: Annotation<string[]>({
    reducer: (current, update) => update ?? current,
  }),
  cooledDownInterests: Annotation<string[]>({
    reducer: (current, update) => update ?? current,
  }),
  schedulingComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),

  // Search phase
  searchResults: Annotation<Article[]>({
    reducer: (current, update) => update ?? current,
  }),
  searchComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),

  // Curation phase
  curatedArticles: Annotation<Article[]>({
    reducer: (current, update) => update ?? current,
  }),
  curationComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  duplicatesFiltered: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),
  newArticlesSaved: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Clustering phase
  clusteredArticles: Annotation<Article[]>({
    reducer: (current, update) => update ?? current,
  }),
  clusteringComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  articleClustersFound: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Topic extraction phase
  topicsExtracted: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  topicsExtractedCount: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Ranking phase
  articlesRanked: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  rankedCount: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Scraping phase
  scrapedContent: Annotation<ScrapedContent[]>({
    reducer: (current, update) => update ?? current,
  }),
  scrapingComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  scrapingSuccessCount: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Summarization phase
  executiveSummary: Annotation<ExecutiveSummary | null>({
    reducer: (current, update) => update ?? current,
  }),
  summarizationComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  briefingId: Annotation<number | null>({
    reducer: (current, update) => update ?? current,
  }),

  // Error handling
  error: Annotation<string>({
    reducer: (current, update) => update ?? current,
  }),
});

// Create the state graph
const workflow = new StateGraph(NewsCuratorState)
  .addNode('settings', settingsAgent)
  .addNode('scheduler', interestSchedulerAgent)
  .addNode('search', searchAgent)
  .addNode('curate', curationAgent)
  .addNode('clustering', articleClusteringAgent)
  .addNode('extract_topics', topicExtractorAgent)
  .addNode('rank', rankingAgent)
  .addNode('scraper', scraperAgent)
  .addNode('summarizer', summarizerAgent)
  .addNode('database_writer', databaseWriterAgent)
  .addEdge(START, 'settings')
  .addEdge('settings', 'scheduler')
  .addEdge('scheduler', 'search')
  .addEdge('search', 'curate')
  .addEdge('curate', 'clustering')
  .addEdge('clustering', 'extract_topics')
  .addEdge('extract_topics', 'rank')
  .addEdge('rank', 'scraper')
  .addEdge('scraper', 'summarizer')
  .addEdge('summarizer', 'database_writer')
  .addEdge('database_writer', END);

// Compile the graph
export const newsCuratorGraph = workflow.compile();

/**
 * Execute the unified news curation workflow
 * Includes clustering, ranking, scraping, summarization, and database writing
 * @param categoryId - Optional category ID to filter interests by category
 */
export async function executeNewsCurationWorkflow(
  categoryId?: number | null
): Promise<WorkflowResult> {
  console.log('🚀 Starting unified news curation workflow...');

  try {
    // Initialize the workflow state
    const initialState = {
      userInterests: [],
      settingsLoaded: false,
      scheduledInterests: [],
      cooledDownInterests: [],
      schedulingComplete: false,
      searchResults: [],
      searchComplete: false,
      curatedArticles: [],
      curationComplete: false,
      duplicatesFiltered: 0,
      newArticlesSaved: 0,
      clusteredArticles: [],
      clusteringComplete: false,
      articleClustersFound: 0,
      topicsExtracted: false,
      topicsExtractedCount: 0,
      articlesRanked: false,
      rankedCount: 0,
      scrapedContent: [],
      scrapingComplete: false,
      scrapingSuccessCount: 0,
      executiveSummary: null,
      summarizationComplete: false,
      briefingId: null,
      categoryId,
    };

    // Execute the workflow using the compiled graph
    const result = await newsCuratorGraph.invoke(initialState);

    console.log('✅ Unified news curation workflow completed successfully');
    console.log(`📊 Workflow results:`);
    console.log(`  - User interests: ${result.userInterests?.length || 0}`);
    console.log(`  - Search results: ${result.searchResults?.length || 0}`);
    console.log(`  - Curated articles: ${result.curatedArticles?.length || 0}`);
    console.log(
      `  - Clustered articles: ${result.clusteredArticles?.length || 0}`
    );
    console.log(`  - Article clusters: ${result.articleClustersFound || 0}`);
    console.log(`  - Topics extracted: ${result.topicsExtractedCount || 0}`);
    console.log(`  - Articles ranked: ${result.rankedCount || 0}`);
    console.log(`  - Successful scrapes: ${result.scrapingSuccessCount || 0}`);
    console.log(`  - Briefing ID: ${result.briefingId || 'None'}`);

    // Send notification if briefing was created
    if (result.briefingId && result.executiveSummary) {
      try {
        const notificationState: NotificationState = {
          briefingId: result.briefingId,
          briefingTitle: result.executiveSummary.title,
          articleCount: result.clusteredArticles?.length || 0,
        };
        await NotificationAgent.sendBriefingNotification(notificationState);
        console.log('📱 Desktop notification sent');
      } catch (notificationError) {
        console.error('📱 Failed to send notification:', notificationError);
      }
    }

    return {
      userInterests: result.userInterests || [],
      searchResults: result.searchResults || [],
      curatedArticles: result.curatedArticles || [],
      clusteredArticles: result.clusteredArticles || [],
      duplicatesFiltered: result.duplicatesFiltered || 0,
      newArticlesSaved: result.newArticlesSaved || 0,
      articleClustersFound: result.articleClustersFound || 0,
      topicsExtractedCount: result.topicsExtractedCount || 0,
      rankedCount: result.rankedCount || 0,
      scrapingSuccessCount: result.scrapingSuccessCount || 0,
      briefingId: result.briefingId || null,
    };
  } catch (error) {
    console.error('❌ Unified news curation workflow failed:', error);
    throw error;
  }
}

// generateSummaryInBackground function removed - now handled by unified workflow

/**
 * Save briefing to database and return the ID
 * Currently unused but kept for future use
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function saveBriefingToDatabase(
  topics: string[],
  articles: Article[]
): Promise<number> {
  // Generate a title for the briefing
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const title = `Daily Briefing - ${date}`;

  const stmt = db.prepare(`
    INSERT INTO Briefings (title, topics_json, articles_json)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    title,
    JSON.stringify(topics),
    JSON.stringify(articles)
  );
  return result.lastInsertRowid as number;
}
