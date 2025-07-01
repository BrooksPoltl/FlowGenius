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

// Load environment variables from .env file
config();

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  // Initialize database and settings
  initializeSettings();

  // Set up IPC handlers for interests management and news curation
  setupInterestsIPC();
  setupNewsIPC();

  await makeAppSetup(MainWindow);
});

/**
 * Sets up IPC handlers for interests CRUD operations
 */
function setupInterestsIPC(): void {
  // Get all interests
  ipcMain.handle('get-interests', () => {
    try {
      return getUserInterests();
    } catch (error) {
      console.error('Error getting interests:', error);
      throw error;
    }
  });

  // Add a new interest
  ipcMain.handle('add-interest', (_, topic: string) => {
    try {
      return addInterest(topic);
    } catch (error) {
      console.error('Error adding interest:', error);
      throw error;
    }
  });

  // Delete an interest
  ipcMain.handle('delete-interest', (_, topic: string) => {
    try {
      return deleteInterest(topic);
    } catch (error) {
      console.error('Error deleting interest:', error);
      throw error;
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
      console.log('Daily news request received');
      const result = await runNewsCuration();
      return {
        success: true,
        articles: result.curatedArticles,
        savedCount: result.savedCount,
        duplicateCount: result.duplicateCount,
        errors: result.searchErrors,
      };
    } catch (error) {
      console.error('Error running news curation:', error);
      return {
        success: false,
        articles: [],
        savedCount: 0,
        duplicateCount: 0,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });
}
