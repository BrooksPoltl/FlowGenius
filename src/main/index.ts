import { app, ipcMain, BrowserWindow } from 'electron';
import { config } from 'dotenv';

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance';
import { makeAppSetup } from 'lib/electron-app/factories/app/setup';
import { MainWindow } from './windows/main';
import {
  initializeSettings,
  getUserInterests,
  addInterest,
  deleteInterest,
} from './services/settings';
import { affinityAgent } from './services/news_curator/agents/affinity';
import { getTopicRecommendations } from './services/recommendations';
import db from './db';
import { DatabaseWriterAgent } from './services/news_curator/agents/database_writer';
import { Article } from '../shared/types';

// Load environment variables from .env file
config();

makeAppWithSingleInstanceLock(async () => {
  console.log('🚀 FlowGenius main process starting...');

  await app.whenReady();
  console.log('✅ Electron app ready');

  // Initialize database and settings
  console.log('📊 Initializing database and settings...');
  initializeSettings();

  // Initialize database writer agent
  // DatabaseWriterAgent methods are now static, no need to instantiate

  // Set up IPC handlers for interests management and news curation
  console.log('🔗 Setting up IPC handlers...');
  setupInterestsIPC();
  setupNewsIPC();

  console.log('🖼️ Creating main window...');
  await makeAppSetup(MainWindow);

  console.log('🎉 FlowGenius is ready! Backend logs will appear here.');
});

/**
 * Sets up IPC handlers for interests CRUD operations
 */
function setupInterestsIPC(): void {
  // Get all interests
  ipcMain.handle('get-interests', async () => {
    try {
      const interests = getUserInterests();
      return { success: true, data: interests };
    } catch (error) {
      console.error('Error getting interests:', error);
      return { success: false, error: 'Failed to get interests' };
    }
  });

  // Add a new interest
  ipcMain.handle('add-interest', async (_, interest: string) => {
    try {
      const success = addInterest(interest);
      return { success };
    } catch (error) {
      console.error('Error adding interest:', error);
      return { success: false, error: 'Failed to add interest' };
    }
  });

  // Delete an interest
  ipcMain.handle('delete-interest', async (_, interest: string) => {
    try {
      const success = deleteInterest(interest);
      return { success };
    } catch (error) {
      console.error('Error deleting interest:', error);
      return { success: false, error: 'Failed to delete interest' };
    }
  });

  // Get topic recommendations
  ipcMain.handle('get-topic-recommendations', async () => {
    try {
      const recommendations = getTopicRecommendations();
      return { success: true, data: recommendations };
    } catch (error) {
      console.error('Error getting topic recommendations:', error);
      return { success: false, error: 'Failed to get topic recommendations' };
    }
  });
}

/**
 * Sets up IPC handlers for news curation workflow
 */
function setupNewsIPC(): void {
  console.log('🔗 Starting setupNewsIPC function...');
  // Get latest briefing
  ipcMain.handle('get-latest-briefing', async () => {
    try {
      console.log('📰 [IPC] Getting latest briefing...');
      console.log('📰 [IPC] Database object:', typeof db, !!db);

      const latestBriefing = db
        .prepare(
          `
        SELECT id, title, created_at,
               (SELECT COUNT(*) FROM Briefing_Articles WHERE briefing_id = Briefings.id) as article_count
        FROM Briefings 
        ORDER BY created_at DESC 
        LIMIT 1
      `
        )
        .get();

      console.log(
        '📰 [IPC] Latest briefing raw result:',
        JSON.stringify(latestBriefing, null, 2)
      );

      if (!latestBriefing) {
        console.log('📰 [IPC] No briefings found in database');
        return { success: false, error: 'No briefings found' };
      }

      const result = { success: true, data: latestBriefing };
      console.log(
        '📰 [IPC] Returning briefing result:',
        JSON.stringify(result, null, 2)
      );
      return result;
    } catch (error) {
      console.error('❌ [IPC] Error getting latest briefing:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get latest briefing',
      };
    }
  });

  // Curate news (trigger workflow)
  ipcMain.handle('curate-news', async () => {
    try {
      console.log('📰 Starting news curation workflow...');
      const { executeNewsCurationWorkflow } = await import(
        './services/news_curator/graph'
      );
      const result = await executeNewsCurationWorkflow();
      console.log('✅ News curation completed successfully');

      return { success: true, data: result };
    } catch (error) {
      console.error('Error curating news:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to curate news',
      };
    }
  });

  // Record article interaction
  ipcMain.handle(
    'record-article-interaction',
    async (_, articleUrl: string, interactionType: string) => {
      try {
        console.log(
          `👆 Recording ${interactionType} interaction on article: ${articleUrl}`
        );

        // Get article ID from URL
        const article = db
          .prepare('SELECT id FROM Articles WHERE url = ?')
          .get(articleUrl) as { id: number } | undefined;

        if (!article) {
          return { success: false, error: 'Article not found' };
        }

        // Record the interaction
        const insertInteraction = db.prepare(`
        INSERT INTO Interactions (article_id, interaction_type)
        VALUES (?, ?)
      `);
        insertInteraction.run(article.id, interactionType);

        return { success: true };
      } catch (error) {
        console.error('Error recording article interaction:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to record interaction',
        };
      }
    }
  );

  // Run the daily news curation workflow
  ipcMain.handle('get-daily-news', async () => {
    const startTime = Date.now();

    try {
      console.log('📰 Starting news curation workflow...');
      const { executeNewsCurationWorkflow } = await import(
        './services/news_curator/graph'
      );
      const result = await executeNewsCurationWorkflow();
      console.log('✅ News curation completed successfully');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Save workflow run statistics to database
      const insertWorkflowRun = db.prepare(`
        INSERT INTO WorkflowRuns (
          interests_count, search_results_count, curated_articles_count, 
          duplicates_filtered_count, new_articles_saved_count, 
          topics_extracted_count, articles_ranked_count, 
          status, completed_at, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'), ?)
      `);

      insertWorkflowRun.run(
        result.userInterests?.length || 0,
        result.searchResults?.length || 0,
        result.curatedArticles?.length || 0,
        result.duplicatesFiltered || 0,
        result.newArticlesSaved || 0,
        result.topicsExtractedCount || 0,
        result.rankedCount || 0,
        duration
      );

      console.log(`📊 Workflow run statistics saved (duration: ${duration}ms)`);

      // Archive the briefing
      if (result.newArticlesSaved > 0) {
        const briefingTitle = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const insertBriefing = db.prepare(
          'INSERT INTO Briefings (title) VALUES (?)'
        );
        const briefingResult = insertBriefing.run(briefingTitle);
        const briefingId = briefingResult.lastInsertRowid;

        const insertBriefingArticle = db.prepare(
          'INSERT INTO Briefing_Articles (briefing_id, article_id) VALUES (?, ?)'
        );

        const getArticleId = db.prepare(
          'SELECT id FROM Articles WHERE url = ?'
        );

        for (const article of result.curatedArticles) {
          const articleRow = getArticleId.get(article.url) as
            | { id: number }
            | undefined;
          if (articleRow) {
            insertBriefingArticle.run(briefingId, articleRow.id);
          }
        }
        console.log(
          `🗞️  Archived briefing "${briefingTitle}" with ${result.curatedArticles.length} articles.`
        );
      }

      // Get the newly curated articles with their personalization scores
      const curatedArticles = result.curatedArticles || [];
      let articles: any[] = [];

      if (curatedArticles.length > 0) {
        // Create a prepared statement to get personalization scores for the new articles
        const placeholders = curatedArticles.map(() => '?').join(',');
        const urls = curatedArticles.map((article: any) => article.url);

        articles = db
          .prepare(
            `
            SELECT url, title, description, source, published_at, thumbnail_url, personalization_score
            FROM Articles 
            WHERE url IN (${placeholders})
            ORDER BY personalization_score DESC, fetched_at DESC
          `
          )
          .all(...urls);

        console.log(
          `📊 Returning ${articles.length} newly curated articles (out of ${curatedArticles.length} processed)`
        );
      } else {
        console.log('📊 No new articles were curated in this run');
      }

      return {
        success: true,
        data: {
          articles,
          stats: {
            interests: result.userInterests?.length || 0,
            searchResults: result.searchResults?.length || 0,
            curatedArticles: result.curatedArticles?.length || 0,
            duplicatesFiltered: result.duplicatesFiltered || 0,
            newArticlesSaved: result.newArticlesSaved || 0,
            topicsExtracted: result.topicsExtractedCount || 0,
            articlesRanked: result.rankedCount || 0,
          },
        },
      };
    } catch (error) {
      console.error('Error getting daily news:', error);

      // Save failed workflow run to database
      const endTime = Date.now();
      const duration = endTime - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get daily news';

      const insertFailedRun = db.prepare(`
        INSERT INTO WorkflowRuns (
          status, error_message, completed_at, duration_ms
        ) VALUES ('failed', ?, datetime('now'), ?)
      `);

      insertFailedRun.run(errorMessage, duration);

      return {
        success: false,
        error: errorMessage,
      };
    }
  });

  // IPC Handler for User Interactions (Personalization)
  ipcMain.handle(
    'handle-interaction',
    async (
      _,
      articleUrl: string,
      interactionType: 'like' | 'dislike' | 'click'
    ) => {
      try {
        console.log(
          `👆 User ${interactionType} interaction on article: ${articleUrl}`
        );
        // Get article ID from URL
        const article = db
          .prepare('SELECT id FROM Articles WHERE url = ?')
          .get(articleUrl) as { id: number } | undefined;

        if (!article) {
          return { success: false, error: 'Article not found' };
        }

        // Record the interaction
        const insertInteraction = db.prepare(`
        INSERT INTO Interactions (article_id, interaction_type)
        VALUES (?, ?)
      `);
        insertInteraction.run(article.id, interactionType);

        // Update topic affinities using AffinityAgent
        const affinityResult = await affinityAgent(article.id, interactionType);

        return {
          success: affinityResult.success,
          data: {
            updatedAffinities: affinityResult.updatedAffinities,
          },
          error: affinityResult.error,
        };
      } catch (error) {
        console.error('Error handling interaction:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to handle interaction',
        };
      }
    }
  );

  // IPC Handler for Dashboard Analytics Data
  ipcMain.handle('get-dashboard-data', async () => {
    try {
      console.log('📊 Fetching dashboard analytics data...');

      // Get topic affinities
      const topicAffinities = db
        .prepare(
          `
          SELECT t.name as topicName, ta.affinity_score as affinityScore, ta.interaction_count as interactionCount
          FROM TopicAffinities ta
          JOIN Topics t ON ta.topic_id = t.id
          ORDER BY ta.affinity_score DESC
        `
        )
        .all();

      // Get article statistics
      const articleStats = db
        .prepare(
          `
          SELECT 
            COUNT(*) as totalArticles,
            COUNT(DISTINCT url) as uniqueArticles
          FROM Articles
        `
        )
        .get() as {
        totalArticles: number;
        uniqueArticles: number;
      };

      // Get workflow statistics (duplicates filtered from actual runs)
      const workflowStats = db
        .prepare(
          `
          SELECT 
            SUM(duplicates_filtered_count) as totalDuplicatesFiltered,
            SUM(new_articles_saved_count) as totalNewArticlesSaved,
            COUNT(*) as totalWorkflowRuns,
            MAX(completed_at) as lastRunTime
          FROM WorkflowRuns 
          WHERE status = 'completed'
        `
        )
        .get() as {
        totalDuplicatesFiltered: number;
        totalNewArticlesSaved: number;
        totalWorkflowRuns: number;
        lastRunTime: string;
      };

      // Get topics count
      const topicsCount = db
        .prepare('SELECT COUNT(*) as count FROM Topics')
        .get() as { count: number };

      // Get interaction statistics
      const interactionStats = db
        .prepare(
          `
          SELECT 
            COUNT(*) as totalInteractions,
            SUM(CASE WHEN interaction_type = 'like' THEN 1 ELSE 0 END) as totalLikes,
            SUM(CASE WHEN interaction_type = 'dislike' THEN 1 ELSE 0 END) as totalDislikes,
            SUM(CASE WHEN interaction_type = 'click' THEN 1 ELSE 0 END) as totalClicks
          FROM Interactions
        `
        )
        .get() as {
        totalInteractions: number;
        totalLikes: number;
        totalDislikes: number;
        totalClicks: number;
      };

      // Get recent interactions
      const recentInteractions = db
        .prepare(
          `
          SELECT 
            a.title as articleTitle,
            i.interaction_type as interactionType,
            i.created_at as timestamp
          FROM Interactions i
          JOIN Articles a ON i.article_id = a.id
          ORDER BY i.created_at DESC
          LIMIT 20
        `
        )
        .all();

      return {
        success: true,
        data: {
          topicAffinities,
          articleStats: {
            ...articleStats,
            duplicatesFiltered: workflowStats.totalDuplicatesFiltered || 0,
            topicsExtracted: topicsCount.count,
          },
          workflowStats: {
            totalWorkflowRuns: workflowStats.totalWorkflowRuns || 0,
            totalNewArticlesSaved: workflowStats.totalNewArticlesSaved || 0,
            lastRunTime: workflowStats.lastRunTime,
          },
          interactionStats,
          recentInteractions,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get dashboard data',
      };
    }
  });

  console.log(
    '🔗 Finished registering dashboard handler, moving to briefings...'
  );

  // IPC Handler for Briefings History
  console.log('🔗 Registering get-briefings-list IPC handler...');
  ipcMain.handle('get-briefings-list', async () => {
    try {
      console.log('📚 Fetching briefings list...');

      const briefings = db
        .prepare(
          `
          SELECT id, title, created_at,
                 (SELECT COUNT(*) FROM Briefing_Articles WHERE briefing_id = Briefings.id) as article_count
          FROM Briefings 
          ORDER BY created_at DESC
        `
        )
        .all();

      return {
        success: true,
        data: briefings,
      };
    } catch (error) {
      console.error('Error getting briefings list:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get briefings list',
      };
    }
  });

  // IPC Handler for Briefing Articles
  console.log('🔗 Registering get-briefing-articles IPC handler...');
  ipcMain.handle('get-briefing-articles', async (_, briefingId: number) => {
    try {
      console.log(
        `📰 [IPC] Fetching articles for briefing ID: ${briefingId}...`
      );
      console.log(`📰 [IPC] Database object:`, typeof db, !!db);

      // First check if the briefing exists
      const briefingExists = db
        .prepare('SELECT id FROM Briefings WHERE id = ?')
        .get(briefingId);
      console.log(`📰 [IPC] Briefing ${briefingId} exists:`, !!briefingExists);

      // Check how many links exist for this briefing
      const linkCount = db
        .prepare(
          'SELECT COUNT(*) as count FROM Briefing_Articles WHERE briefing_id = ?'
        )
        .get(briefingId) as { count: number };
      console.log(
        `📰 [IPC] Found ${linkCount.count} article links for briefing ${briefingId}`
      );

      const articles = db
        .prepare(
          `
          SELECT a.url, a.title, a.description, a.source, a.published_at, 
                 a.thumbnail_url, a.personalization_score
          FROM Articles a
          JOIN Briefing_Articles ba ON a.id = ba.article_id
          WHERE ba.briefing_id = ?
          ORDER BY a.personalization_score DESC, a.fetched_at DESC
        `
        )
        .all(briefingId);

      console.log(`📰 [IPC] Query returned ${articles.length} articles`);
      console.log(
        `📰 [IPC] First article:`,
        articles[0] ? JSON.stringify(articles[0], null, 2) : 'None'
      );

      return {
        success: true,
        data: articles,
      };
    } catch (error) {
      console.error('❌ [IPC] Error getting briefing articles:', error);
      console.error(
        '❌ [IPC] Error stack:',
        error instanceof Error ? error.stack : 'No stack'
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get briefing articles',
      };
    }
  });

  // IPC Handler for Article Interactions
  console.log('🔗 Registering get-article-interactions IPC handler...');
  ipcMain.handle(
    'get-article-interactions',
    async (_, articleUrls: string[]) => {
      try {
        console.log(
          `🔍 Fetching interactions for ${articleUrls.length} articles...`
        );

        if (articleUrls.length === 0) {
          return { success: true, data: {} };
        }

        const placeholders = articleUrls.map(() => '?').join(',');
        const interactions = db
          .prepare(
            `
          SELECT a.url, i.interaction_type, i.created_at
          FROM Articles a
          JOIN Interactions i ON a.id = i.article_id
          WHERE a.url IN (${placeholders})
          ORDER BY i.created_at DESC
        `
          )
          .all(...articleUrls);

        // Group interactions by URL, keeping only the most recent like/dislike
        const interactionMap: Record<
          string,
          { type: 'like' | 'dislike' | 'click'; timestamp: string }
        > = {};

        for (const interaction of interactions as Array<{
          url: string;
          interaction_type: string;
          created_at: string;
        }>) {
          const { url } = interaction;
          const type = interaction.interaction_type;

          // For like/dislike, keep only the most recent one
          if (type === 'like' || type === 'dislike') {
            if (!interactionMap[url] || interactionMap[url].type === 'click') {
              interactionMap[url] = {
                type: type as 'like' | 'dislike',
                timestamp: interaction.created_at,
              };
            }
          }
          // For clicks, only set if no interaction exists yet
          else if (type === 'click' && !interactionMap[url]) {
            interactionMap[url] = {
              type: 'click',
              timestamp: interaction.created_at,
            };
          }
        }

        return {
          success: true,
          data: interactionMap,
        };
      } catch (error) {
        console.error('Error getting article interactions:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get article interactions',
        };
      }
    }
  );

  // Summary IPC handlers
  ipcMain.handle('get-summary', async (_, briefingId: number) => {
    try {
      const briefing = DatabaseWriterAgent.getBriefingWithSummary(briefingId);
      if (!briefing) return null;

      return DatabaseWriterAgent.parseSummaryFromBriefing(briefing);
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  });

  ipcMain.handle('get-summary-stats', async () => {
    try {
      return DatabaseWriterAgent.getSummaryStats();
    } catch (error) {
      console.error('Error getting summary stats:', error);
      throw error;
    }
  });

  // Manual summary generation handler for testing
  ipcMain.handle('generate-summary', async (_, briefingId: number) => {
    try {
      console.log(
        `🧪 Manual summary generation requested for briefing ${briefingId}`
      );

      // Check if briefing exists first
      const briefingExists = db
        .prepare('SELECT id FROM Briefings WHERE id = ?')
        .get(briefingId);

      if (!briefingExists) {
        return { success: false, error: 'Briefing not found' };
      }

      // Get briefing articles
      const articles = db
        .prepare(
          `
          SELECT a.url, a.title, a.description, a.source, a.published_at, 
                 a.thumbnail_url, a.personalization_score
          FROM Articles a
          JOIN Briefing_Articles ba ON a.id = ba.article_id
          WHERE ba.briefing_id = ?
          ORDER BY a.personalization_score DESC, a.fetched_at DESC
        `
        )
        .all(briefingId) as Article[];

      if (articles.length === 0) {
        return { success: false, error: 'No articles found for briefing' };
      }

      // Get user interests as topics
      const { getUserInterests } = await import('./services/settings');
      const topics = getUserInterests();

      console.log(
        `🧪 Starting manual summary generation with ${articles.length} articles and ${topics.length} topics`
      );

      // Import the background generation function
      const { generateSummaryInBackground } = await import(
        './services/news_curator/graph'
      );

      // Start the background process with force=true to regenerate
      generateSummaryInBackground(briefingId, articles, topics, true)
        .then(() => {
          console.log(
            `🧪 Manual summary generation completed for briefing ${briefingId}`
          );
        })
        .catch(error => {
          console.error(
            `🧪 Manual summary generation failed for briefing ${briefingId}:`,
            error
          );
        });

      return { success: true, message: 'Summary generation started (force)' };
    } catch (error) {
      console.error('Error starting manual summary generation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start summary generation',
      };
    }
  });
}

// Function to notify renderer when summary is ready (exported for use in graph)
export function notifyRendererSummaryReady(briefingId: number): void {
  const mainWindow = BrowserWindow.getAllWindows().find(
    (win: BrowserWindow) => !win.isDestroyed()
  );
  if (mainWindow) {
    mainWindow.webContents.send('summary-ready', briefingId);
  }
}
