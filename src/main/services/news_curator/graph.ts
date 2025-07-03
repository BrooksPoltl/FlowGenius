/**
 * News Curator LangGraph Implementation
 * Orchestrates the news curation workflow using LangGraph state management
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { BrowserWindow } from 'electron';
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
import { notifyRendererBriefingCreated } from '../notification-utils';

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

// Progress tracking interface
export interface WorkflowProgress {
  currentStep: string;
  totalSteps: number;
  stepIndex: number;
  stepName: string;
  status: 'starting' | 'in_progress' | 'completed' | 'error';
  message?: string;
  timestamp: string;
}

// Workflow step definitions
const WORKFLOW_STEPS = [
  { key: 'settings', name: 'Loading Settings', message: 'Retrieving user preferences and interests' },
  { key: 'scheduler', name: 'Checking Schedule', message: 'Processing interest cooldowns and scheduling' },
  { key: 'search', name: 'Searching Articles', message: 'Finding relevant news articles' },
  { key: 'curate', name: 'Curating Content', message: 'Filtering and organizing articles' },
  { key: 'clustering', name: 'Clustering Articles', message: 'Grouping related articles together' },
  { key: 'extract_topics', name: 'Extracting Topics', message: 'Analyzing article topics and themes' },
  { key: 'rank', name: 'Ranking Articles', message: 'Prioritizing articles by relevance' },
  { key: 'scraper', name: 'Scraping Content', message: 'Extracting full article content' },
  { key: 'summarizer', name: 'Generating Summary', message: 'Creating executive summary' },
  { key: 'database_writer', name: 'Saving Results', message: 'Storing briefing in database' },
];

/**
 * Send progress update to renderer process
 */
function notifyRendererProgress(progress: WorkflowProgress): void {
  try {
    const mainWindow = BrowserWindow.getAllWindows().find(
      (win: BrowserWindow) => !win.isDestroyed()
    );
    if (mainWindow) {
      mainWindow.webContents.send('workflow-progress', progress);
      console.log(`📊 Progress: ${progress.stepName} (${progress.stepIndex}/${progress.totalSteps})`);
    }
  } catch (error) {
    console.error('📊 Failed to send progress update:', error);
  }
}

/**
 * Create progress update object
 */
function createProgressUpdate(
  stepKey: string, 
  status: WorkflowProgress['status'], 
  customMessage?: string
): WorkflowProgress {
  const stepIndex = WORKFLOW_STEPS.findIndex(step => step.key === stepKey);
  const step = WORKFLOW_STEPS[stepIndex];
  
  return {
    currentStep: stepKey,
    totalSteps: WORKFLOW_STEPS.length,
    stepIndex: stepIndex + 1,
    stepName: step?.name || stepKey,
    status,
    message: customMessage || step?.message,
    timestamp: new Date().toISOString(),
  };
}

// Define the state schema using Annotation.Root()
const NewsCuratorState = Annotation.Root({
  // Progress tracking
  progress: Annotation<WorkflowProgress>({
    reducer: (current, update) => update ?? current,
  }),
  
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

  // Pass-through state for workflow control
  categoryId: Annotation<number | null>({
    reducer: (current, update) => update ?? current,
  }),
  force: Annotation<boolean>({
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
 * Execute the unified news curation workflow with progress tracking
 * Includes clustering, ranking, scraping, summarization, and database writing
 * @param categoryId - Optional category ID to filter interests by category
 * @param force - Optional force parameter to force re-execution
 */
export async function executeNewsCurationWorkflow(
  categoryId?: number | null,
  force?: boolean
): Promise<WorkflowResult> {
  console.log('🚀 Starting unified news curation workflow...');

  try {
    // Send initial progress update
    const initialProgress = createProgressUpdate('settings', 'starting');
    notifyRendererProgress(initialProgress);

    // Initialize the workflow state
    const initialState = {
      progress: initialProgress,
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
      force,
    };

    let result: any;

    // Execute the workflow using streaming to get progress updates
    const stream = await newsCuratorGraph.stream(initialState);
    
    for await (const chunk of stream) {
      // chunk contains the updated state after each node execution
      const [nodeName, nodeResult] = Object.entries(chunk)[0];
      
      if (nodeResult && typeof nodeResult === 'object') {
        result = nodeResult;
        
        // Send progress update for completed step
        const completedProgress = createProgressUpdate(nodeName, 'completed');
        notifyRendererProgress(completedProgress);
        
        // Send progress update for next step (if not at the end)
        const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.key === nodeName);
        if (currentStepIndex >= 0 && currentStepIndex < WORKFLOW_STEPS.length - 1) {
          const nextStep = WORKFLOW_STEPS[currentStepIndex + 1];
          const nextProgress = createProgressUpdate(nextStep.key, 'starting');
          notifyRendererProgress(nextProgress);
        }
      }
    }

    // Ensure we have the final result
    if (!result) {
      result = await newsCuratorGraph.invoke(initialState);
    }

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

    // Notify renderer to update UI when briefing is created
    if (result.briefingId) {
      try {
        notifyRendererBriefingCreated(result.briefingId);
        console.log('🔔 Renderer notified of new briefing');
      } catch (rendererError) {
        console.error('🔔 Failed to notify renderer:', rendererError);
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
