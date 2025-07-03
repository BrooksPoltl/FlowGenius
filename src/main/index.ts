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
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getInterestsForCategory,
  setInterestsForCategory,
  getCategorySchedule,
  setCategorySchedule,
} from './services/categories';
import {
  getUserSettings,
  updateUserSettings,
  getSetting,
  setSetting,
} from './services/user-settings';
import { SchedulerService } from './services/scheduler';
import { affinityAgent } from './services/news_curator/agents/affinity';
import { getTopicRecommendations } from './services/recommendations';
import db from './db';
import { DatabaseWriterAgent } from './services/news_curator/agents/database_writer';
import { Article, UserSettings } from '../shared/types';

// Load environment variables from .env file
config();

makeAppWithSingleInstanceLock(async () => {
  console.log('🚀 FlowGenius main process starting...');

  await app.whenReady();
  console.log('✅ Electron app ready');

  // Initialize database and settings
  console.log('📊 Initializing database and settings...');
  initializeSettings();

  // Initialize scheduler service
  console.log('⏰ Initializing scheduler service...');
  const scheduler = SchedulerService.getInstance();
  scheduler.initialize();

  // Initialize database writer agent
  // DatabaseWriterAgent methods are now static, no need to instantiate

  // Set up IPC handlers for interests management and news curation
  console.log('🔗 Setting up IPC handlers...');
  setupInterestsIPC();
  setupCategoriesIPC();
  setupNewsIPC();
  setupSettingsIPC();

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
 * Sets up IPC handlers for categories CRUD operations
 */
function setupCategoriesIPC(): void {
  // Get all categories
  ipcMain.handle('categories:get-all', async () => {
    try {
      const categories = getAllCategories();
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: false, error: 'Failed to get categories' };
    }
  });

  // Create a new category
  ipcMain.handle('categories:create', async (_, name: string) => {
    try {
      const categoryId = createCategory(name);
      return { success: !!categoryId, data: categoryId };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: 'Failed to create category' };
    }
  });

  // Update category name
  ipcMain.handle(
    'categories:update',
    async (_, categoryId: number, name: string) => {
      try {
        const success = updateCategory(categoryId, name);
        return { success };
      } catch (error) {
        console.error('Error updating category:', error);
        return { success: false, error: 'Failed to update category' };
      }
    }
  );

  // Delete a category
  ipcMain.handle('categories:delete', async (_, categoryId: number) => {
    try {
      const success = deleteCategory(categoryId);
      return { success };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: 'Failed to delete category' };
    }
  });

  // Get interests for a category
  ipcMain.handle('categories:get-interests', async (_, categoryId: number) => {
    try {
      const interests = getInterestsForCategory(categoryId);
      return { success: true, data: interests };
    } catch (error) {
      console.error('Error getting interests for category:', error);
      return { success: false, error: 'Failed to get interests for category' };
    }
  });

  // Set interests for a category
  ipcMain.handle(
    'categories:set-interests',
    async (_, categoryId: number, interestNames: string[]) => {
      try {
        const success = setInterestsForCategory(categoryId, interestNames);
        return { success };
      } catch (error) {
        console.error('Error setting interests for category:', error);
        return {
          success: false,
          error: 'Failed to set interests for category',
        };
      }
    }
  );

  // Get category schedule
  ipcMain.handle('categories:get-schedule', async (_, categoryId: number) => {
    try {
      const schedule = getCategorySchedule(categoryId);
      return { success: true, data: schedule };
    } catch (error) {
      console.error('Error getting category schedule:', error);
      return { success: false, error: 'Failed to get category schedule' };
    }
  });

  // Set category schedule
  ipcMain.handle(
    'categories:set-schedule',
    async (
      _,
      categoryId: number,
      cronExpression: string,
      isEnabled: boolean
    ) => {
      try {
        const success = setCategorySchedule(
          categoryId,
          cronExpression,
          isEnabled
        );
        return { success };
      } catch (error) {
        console.error('Error setting category schedule:', error);
        return { success: false, error: 'Failed to set category schedule' };
      }
    }
  );
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
  ipcMain.handle('curate-news', async (_, categoryId?: number | null) => {
    try {
      console.log(
        `📰 Starting news curation workflow for category ${categoryId || 'General'}...`
      );
      const { executeNewsCurationWorkflow } = await import(
        './services/news_curator/graph'
      );
      const result = await executeNewsCurationWorkflow(categoryId);
      console.log('✅ News curation completed successfully');

      // Create briefing when there are curated articles, not just new ones
      if (result.curatedArticles && result.curatedArticles.length > 0) {
        let briefingTitle = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Add category name if categoryId was provided
        if (categoryId) {
          const { getCategoryById } = await import('./services/categories');
          const category = await getCategoryById(categoryId);
          if (category) {
            briefingTitle = `${category.name} - ${briefingTitle}`;
          }
        }

        // Get user interests for briefing
        const { getUserInterests } = await import('./services/settings');
        const topics = getUserInterests();

        const insertBriefing = db.prepare(
          'INSERT INTO Briefings (title, topics_json, articles_json) VALUES (?, ?, ?)'
        );
        const briefingResult = insertBriefing.run(
          briefingTitle,
          JSON.stringify(topics),
          JSON.stringify(result.curatedArticles)
        );
        const briefingId = Number(briefingResult.lastInsertRowid);

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
          `🗞️  Created briefing "${briefingTitle}" with ${result.curatedArticles.length} articles (${result.newArticlesSaved} new, ${result.duplicatesFiltered} duplicates filtered).`
        );

        // Notify renderer that a new briefing was created
        notifyRendererBriefingCreated(briefingId);

        // Summary generation is now handled by the unified workflow
        console.log('📝 Summary generation handled by unified workflow');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error curating news:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to curate news',
      };
    }
  });

  // Force refresh (bypasses cooldown periods)
  ipcMain.handle('force-refresh', async () => {
    try {
      console.log('🔄 Starting force refresh (bypassing cooldowns)...');

      // Reset all interest search attempt times to allow immediate refresh
      const resetSearchAttempts = db.prepare(`
        UPDATE Interests 
        SET last_search_attempt_at = NULL
      `);
      const resetResult = resetSearchAttempts.run();
      console.log(
        `🔄 Reset search attempts for ${resetResult.changes} interests`
      );

      const { executeNewsCurationWorkflow } = await import(
        './services/news_curator/graph'
      );
      const result = await executeNewsCurationWorkflow();
      console.log('✅ Force refresh completed successfully');

      // Create briefing when there are curated articles, not just new ones
      if (result.curatedArticles && result.curatedArticles.length > 0) {
        let briefingTitle = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Force refresh doesn't use categories, so use "General" prefix
        briefingTitle = `General - ${briefingTitle}`;

        // Get user interests for briefing
        const { getUserInterests: getUserInterests2 } = await import(
          './services/settings'
        );
        const topics2 = getUserInterests2();

        const insertBriefing = db.prepare(
          'INSERT INTO Briefings (title, topics_json, articles_json) VALUES (?, ?, ?)'
        );
        const briefingResult = insertBriefing.run(
          briefingTitle,
          JSON.stringify(topics2),
          JSON.stringify(result.curatedArticles)
        );
        const briefingId = Number(briefingResult.lastInsertRowid);

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
          `🗞️  Created briefing "${briefingTitle}" with ${result.curatedArticles.length} articles (${result.newArticlesSaved} new, ${result.duplicatesFiltered} duplicates filtered).`
        );

        // Notify renderer that a new briefing was created
        notifyRendererBriefingCreated(briefingId);

        // Summary generation is now handled by the unified workflow
        console.log('📝 Summary generation handled by unified workflow');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error with force refresh:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to force refresh',
      };
    }
  });

  // Get cooldown status for interests
  ipcMain.handle('get-cooldown-status', async () => {
    try {
      console.log('📊 Checking cooldown status for interests...');

      const { interestSchedulerAgent } = await import(
        './services/news_curator/agents/scheduler'
      );
      const { getUserInterests } = await import('./services/settings');

      const userInterests = getUserInterests();
      const schedulerResult = await interestSchedulerAgent({
        userInterests,
        settingsLoaded: true,
      });

      return {
        success: true,
        data: {
          scheduled: schedulerResult.scheduledInterests || [],
          cooledDown: schedulerResult.cooledDownInterests || [],
        },
      };
    } catch (error) {
      console.error('Error checking cooldown status:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check cooldown status',
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

      // Archive the briefing - Create briefing when there are curated articles, not just new ones
      if (result.curatedArticles && result.curatedArticles.length > 0) {
        let briefingTitle = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Daily news doesn't use categories, so use "Daily" prefix
        briefingTitle = `Daily - ${briefingTitle}`;

        // Get user interests for briefing
        const { getUserInterests: getUserInterests3 } = await import(
          './services/settings'
        );
        const topics3 = getUserInterests3();

        const insertBriefing = db.prepare(
          'INSERT INTO Briefings (title, topics_json, articles_json) VALUES (?, ?, ?)'
        );
        const briefingResult = insertBriefing.run(
          briefingTitle,
          JSON.stringify(topics3),
          JSON.stringify(result.curatedArticles)
        );
        const briefingId = Number(briefingResult.lastInsertRowid);

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
          `🗞️  Archived briefing "${briefingTitle}" with ${result.curatedArticles.length} articles (${result.newArticlesSaved} new, ${result.duplicatesFiltered} duplicates filtered).`
        );

        // Notify renderer that a new briefing was created
        notifyRendererBriefingCreated(briefingId);

        // Summary generation is now handled by the unified workflow
        console.log('📝 Summary generation handled by unified workflow');
      }

      // Get the newly curated articles with their personalization scores
      const curatedArticles = result.curatedArticles || [];
      let articles: Article[] = [];

      if (curatedArticles.length > 0) {
        // Create a prepared statement to get personalization scores for the new articles
        const placeholders = curatedArticles.map(() => '?').join(',');
        const urls = curatedArticles.map((article: Article) => article.url);

        articles = db
          .prepare(
            `
            SELECT url, title, description, source, published_at, thumbnail_url, personalization_score
            FROM Articles 
            WHERE url IN (${placeholders})
            ORDER BY personalization_score DESC, fetched_at DESC
          `
          )
          .all(...urls) as Article[];

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

      // Note: Manual summary generation is no longer supported with unified workflow
      // The unified workflow now handles all summary generation automatically
      console.log(
        '🧪 Manual summary generation not supported with unified workflow'
      );

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

/**
 * Sets up IPC handlers for user settings management
 */
function setupSettingsIPC(): void {
  // Get all user settings
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = getUserSettings();
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return { success: false, error: 'Failed to get user settings' };
    }
  });

  // Update user settings
  ipcMain.handle('settings:update', async (_, settings) => {
    try {
      updateUserSettings(settings);

      // Update scheduler with new settings
      const scheduler = SchedulerService.getInstance();
      scheduler.updateSchedules();

      return { success: true };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error: 'Failed to update user settings' };
    }
  });

  // Get a specific setting
  ipcMain.handle('settings:get-setting', async (_, key: keyof UserSettings) => {
    try {
      const value = getSetting(key);
      return { success: true, data: value };
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return { success: false, error: `Failed to get setting ${key}` };
    }
  });

  // Set a specific setting
  ipcMain.handle(
    'settings:set-setting',
    async (_, key: keyof UserSettings, value: string | boolean) => {
      try {
        setSetting(key, value);
        return { success: true };
      } catch (error) {
        console.error(`Error setting ${key}:`, error);
        return { success: false, error: `Failed to set setting ${key}` };
      }
    }
  );

  // Manual trigger for testing scheduler
  ipcMain.handle('scheduler:trigger-manual', async () => {
    try {
      await SchedulerService.triggerManualBriefing();
      return { success: true };
    } catch (error) {
      console.error('Error triggering manual briefing:', error);
      return { success: false, error: 'Failed to trigger manual briefing' };
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

// Function to notify renderer when a new briefing is created
export function notifyRendererBriefingCreated(briefingId: number): void {
  const mainWindow = BrowserWindow.getAllWindows().find(
    (win: BrowserWindow) => !win.isDestroyed()
  );
  if (mainWindow) {
    mainWindow.webContents.send('briefing-created', briefingId);
  }
  console.log(`📢 Notified renderer that briefing ${briefingId} was created`);
}
