import { app, ipcMain } from 'electron';
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
import { runNewsCuration } from './services/news_curator/graph';
import { affinityAgent } from './services/news_curator/agents/affinity';
import db from './db';

// Load environment variables from .env file
config();

makeAppWithSingleInstanceLock(async () => {
  console.log('🚀 FlowGenius main process starting...');

  await app.whenReady();
  console.log('✅ Electron app ready');

  // Initialize database and settings
  console.log('📊 Initializing database and settings...');
  initializeSettings();

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
}

/**
 * Sets up IPC handlers for news curation workflow
 */
function setupNewsIPC(): void {
  // Run the daily news curation workflow
  ipcMain.handle('get-daily-news', async () => {
    try {
      console.log('📰 Starting news curation workflow...');
      const result = await runNewsCuration();
      console.log('✅ News curation completed successfully');

      // Get articles sorted by personalization score
      const articles = db
        .prepare(
          `
        SELECT url, title, description, source, published_at, thumbnail_url, personalization_score
        FROM Articles 
        ORDER BY personalization_score DESC, fetched_at DESC
        LIMIT 50
      `
        )
        .all();

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
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get daily news',
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
}
