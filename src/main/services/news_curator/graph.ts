/**
 * News Curator LangGraph Implementation
 * Orchestrates the news curation workflow using LangGraph state management
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { settingsAgent } from './agents/settings';
import { interestSchedulerAgent } from './agents/scheduler';
import { searchAgent } from './agents/search';
import { curationAgent } from './agents/curation';
import { topicExtractorAgent } from './agents/topic_extractor';
import { rankingAgent } from './agents/ranking';
import { ScraperAgent } from './agents/scraper';
import { SummarizerAgent } from './agents/summarizer';
import { DatabaseWriterAgent } from './agents/database_writer';
import { NotificationAgent, NotificationState } from './agents/notification';
import { Article } from '../../../shared/types';
import db from '../../db';

/**
 * Workflow execution result containing metrics and data
 */
export interface WorkflowResult {
  userInterests: string[];
  searchResults: Article[];
  curatedArticles: Article[];
  duplicatesFiltered: number;
  newArticlesSaved: number;
  topicsExtractedCount: number;
  rankedCount: number;
}

/**
 * Scraper result for individual articles
 */
export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  success: boolean;
  error?: string;
}

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
  .addNode('extract_topics', topicExtractorAgent)
  .addNode('rank', rankingAgent)
  .addEdge(START, 'settings')
  .addEdge('settings', 'scheduler')
  .addEdge('scheduler', 'search')
  .addEdge('search', 'curate')
  .addEdge('curate', 'extract_topics')
  .addEdge('extract_topics', 'rank')
  .addEdge('rank', END);

// Compile the graph
export const newsCuratorGraph = workflow.compile();

/**
 * Execute the news curation workflow
 * Now includes background summary generation after ranking
 */
export async function executeNewsCurationWorkflow(): Promise<WorkflowResult> {
  console.log('🚀 Starting news curation workflow...');

  try {
    // Phase 1: Core curation workflow (blocking)
    // Get user settings and interests
    const { getUserInterests } = await import('../settings');
    const userInterests = getUserInterests();
    console.log('📋 Settings loaded');

    const schedulerResult = await interestSchedulerAgent({
      userInterests,
      settingsLoaded: true,
    });
    console.log(
      `📅 Scheduled ${schedulerResult.scheduledInterests.length} interests for search`
    );

    if (schedulerResult.scheduledInterests.length === 0) {
      console.log('⏰ No interests ready for search due to cool-down periods');
      return {
        userInterests,
        searchResults: [],
        curatedArticles: [],
        duplicatesFiltered: 0,
        newArticlesSaved: 0,
        topicsExtractedCount: 0,
        rankedCount: 0,
      };
    }

    const searchResult = await searchAgent({
      scheduledInterests: schedulerResult.scheduledInterests,
      schedulingComplete: true,
    });
    console.log(
      `🔍 Found ${searchResult.searchResults.length} articles from search`
    );

    if (searchResult.searchResults.length === 0) {
      console.log('📭 No new articles found');
      return {
        userInterests,
        searchResults: [],
        curatedArticles: [],
        duplicatesFiltered: 0,
        newArticlesSaved: 0,
        topicsExtractedCount: 0,
        rankedCount: 0,
      };
    }

    const curationResult = await curationAgent({
      searchResults: searchResult.searchResults,
      searchComplete: true,
    });
    console.log(`📝 Curated ${curationResult.curatedArticles.length} articles`);

    if (curationResult.curatedArticles.length === 0) {
      console.log('🚫 No articles passed curation filters');
      return {
        userInterests,
        searchResults: searchResult.searchResults,
        curatedArticles: [],
        duplicatesFiltered: curationResult.duplicatesFiltered || 0,
        newArticlesSaved: 0,
        topicsExtractedCount: 0,
        rankedCount: 0,
      };
    }

    const topicResult = await topicExtractorAgent({
      curatedArticles: curationResult.curatedArticles,
      curationComplete: true,
    });
    console.log(`🏷️ Extracted ${topicResult.topicsExtractedCount} topics`);

    const rankingResult = await rankingAgent({
      curatedArticles: curationResult.curatedArticles,
      topicsExtracted: true,
      topicsExtractedCount: topicResult.topicsExtractedCount,
    });
    console.log(`📊 Ranked ${rankingResult.rankedCount} articles`);

    // Extract topics list for summary generation
    const extractedTopics = userInterests; // Use user interests as topics for now

    console.log('✅ News curation workflow completed successfully');

    // Return the workflow result
    return {
      userInterests,
      searchResults: searchResult.searchResults,
      curatedArticles: curationResult.curatedArticles,
      duplicatesFiltered: curationResult.duplicatesFiltered || 0,
      newArticlesSaved: curationResult.newArticlesSaved || 0,
      topicsExtractedCount: topicResult.topicsExtractedCount || 0,
      rankedCount: rankingResult.rankedCount || 0,
    };
  } catch (error) {
    console.error('❌ News curation workflow failed:', error);
    throw error;
  }
}

/**
 * Generate executive summary in the background
 * This runs asynchronously after the main workflow completes
 */
export async function generateSummaryInBackground(
  briefingId: number,
  articles: Article[],
  topics: string[],
  force = false
): Promise<void> {
  console.log(`📝 Starting background summary generation...`);
  console.log(
    `📝 Briefing ID: ${briefingId}, Articles: ${articles.length}, Topics: ${topics.length}`
  );

  try {
    const scraperAgent = new ScraperAgent();
    const summarizerAgent = new SummarizerAgent();

    // Check if summary already exists (unless forced)
    console.log('📝 Checking if summary already exists...');
    if (!force && DatabaseWriterAgent.briefingHasSummary(briefingId)) {
      console.log('📄 Summary already exists for this briefing');
      return;
    }

    if (force && DatabaseWriterAgent.briefingHasSummary(briefingId)) {
      console.log('📄 Summary exists but force=true, regenerating...');
    }

    // Step 1: Scrape full article content
    console.log('🕷️ Starting article scraping...');
    console.log(`🕷️ Scraping ${articles.length} articles...`);

    // Add timeout wrapper for scraping
    const scrapingPromise = scraperAgent.scrapeArticles(articles);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Scraping timeout after 5 minutes')),
        5 * 60 * 1000
      );
    });

    const scrapedContent = (await Promise.race([
      scrapingPromise,
      timeoutPromise,
    ])) as ScrapedContent[];
    const successfulScrapes = scrapedContent.filter(
      (content: ScrapedContent) => content.success
    );
    console.log(
      `✅ Successfully scraped ${successfulScrapes.length}/${articles.length} articles`
    );

    // Log details about failed scrapes
    const failedScrapes = scrapedContent.filter(
      (content: ScrapedContent) => !content.success
    );
    if (failedScrapes.length > 0) {
      console.log(`⚠️ Failed scrapes: ${failedScrapes.length}`);
      failedScrapes.forEach((failed: ScrapedContent, index: number) => {
        if (index < 3) {
          // Only log first 3 failures to avoid spam
          console.log(`  - ${failed.url}: ${failed.error}`);
        }
      });
    }

    // Step 2: Generate executive summary
    console.log('🤖 Generating executive summary...');
    const summary = await summarizerAgent.generateSummary(
      scrapedContent,
      articles,
      topics
    );
    console.log('📋 Executive summary generated');
    console.log(
      `📋 Summary has ${summary.mainStories.length} main stories, ${summary.quickBites.length} quick bites`
    );

    // Log the full summary for debugging
    console.log('📋 Generated Summary:');
    console.log(`  Title: "${summary.title}"`);
    console.log(`  Subtitle: "${summary.subtitle}"`);
    console.log('  Main Stories:');
    summary.mainStories.forEach((story, index) => {
      console.log(`    ${index + 1}. ${story.headline}`);
      console.log(`       Summary: ${story.summary.substring(0, 100)}...`);
      console.log(`       Takeaway: ${story.keyTakeaway}`);
    });
    console.log('  Quick Bites:');
    summary.quickBites.forEach((bite, index) => {
      console.log(`    ${index + 1}. ${bite.headline}`);
      console.log(`       ${bite.oneLineSummary}`);
    });

    // Step 3: Save to database
    console.log('💾 Saving summary to database...');
    await DatabaseWriterAgent.saveSummaryToBriefing(briefingId, summary);
    console.log('✅ Summary saved successfully');

    // Notify renderer that summary is ready
    console.log('📢 Notifying renderer that summary is ready...');
    await notifyRendererSummaryReady(briefingId);
    console.log('📢 Notification sent');

    // Send desktop notification
    console.log('📱 Sending desktop notification...');
    const notificationState: NotificationState = {
      briefingId,
      briefingTitle: `Daily Briefing - ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      articleCount: articles.length,
    };
    await NotificationAgent.sendBriefingNotification(notificationState);
    console.log('📱 Desktop notification sent');
  } catch (error) {
    console.error('❌ Background summary generation failed:', error);
    console.error(
      '❌ Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    // Don't throw - this is background processing
  }
}

/**
 * Save briefing to database and return the ID
 */
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

/**
 * Notify renderer process that summary is ready
 */
async function notifyRendererSummaryReady(briefingId: number): Promise<void> {
  try {
    // Import BrowserWindow at runtime to avoid circular dependency issues
    const electron = await import('electron');
    const mainWindow = electron.BrowserWindow.getAllWindows().find(
      win => !win.isDestroyed()
    );

    if (mainWindow) {
      console.log(`📢 Sending summary-ready event for briefing ${briefingId}`);
      mainWindow.webContents.send('summary-ready', briefingId);
      console.log(`📢 Summary-ready event sent successfully`);
    } else {
      console.log(`📢 No main window found for notification`);
    }
  } catch (error) {
    console.error(`📢 Error sending notification:`, error);
  }
}
