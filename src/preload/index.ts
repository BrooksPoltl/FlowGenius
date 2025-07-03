import { contextBridge, ipcRenderer } from 'electron';
import os from 'os';
import type { UserSettings } from '../shared/types';

console.log('🔧 Preload script starting...');

declare global {
  interface Window {
    electronAPI: typeof API;
  }
}

const API = {
  sayHelloFromBridge: () => {
    console.log('Hello from the bridge!');
  },
  username: os.userInfo().username,

  // Interests management
  getInterests: () => ipcRenderer.invoke('get-interests'),
  addInterest: (interest: string) =>
    ipcRenderer.invoke('add-interest', interest),
  deleteInterest: (interest: string) =>
    ipcRenderer.invoke('delete-interest', interest),
  getTopicRecommendations: () =>
    ipcRenderer.invoke('get-topic-recommendations'),

  // Categories management
  getAllCategories: () => ipcRenderer.invoke('categories:get-all'),
  createCategory: (name: string) =>
    ipcRenderer.invoke('categories:create', name),
  updateCategory: (categoryId: number, name: string) =>
    ipcRenderer.invoke('categories:update', categoryId, name),
  deleteCategory: (categoryId: number) =>
    ipcRenderer.invoke('categories:delete', categoryId),
  getInterestsForCategory: (categoryId: number) =>
    ipcRenderer.invoke('categories:get-interests', categoryId),
  setInterestsForCategory: (categoryId: number, interestNames: string[]) =>
    ipcRenderer.invoke('categories:set-interests', categoryId, interestNames),
  getCategorySchedule: (categoryId: number) =>
    ipcRenderer.invoke('categories:get-schedule', categoryId),
  setCategorySchedule: (
    categoryId: number,
    cronExpression: string,
    isEnabled: boolean
  ) =>
    ipcRenderer.invoke(
      'categories:set-schedule',
      categoryId,
      cronExpression,
      isEnabled
    ),

  // News curation
  getDailyNews: () => ipcRenderer.invoke('get-daily-news'),

  curateNews: (categoryId?: number | null) =>
    ipcRenderer.invoke('curate-news', categoryId),
  recordArticleInteraction: (articleUrl: string, interactionType: string) =>
    ipcRenderer.invoke(
      'record-article-interaction',
      articleUrl,
      interactionType
    ),

  // User interactions for personalization
  handleInteraction: (
    articleUrl: string,
    interactionType: 'like' | 'dislike' | 'click'
  ) => ipcRenderer.invoke('handle-interaction', articleUrl, interactionType),

  // Dashboard analytics
  getDashboardData: () => {
    console.log('🔧 getDashboardData called from preload');
    return ipcRenderer.invoke('get-dashboard-data');
  },

  // Briefings history
  getBriefingsList: () => ipcRenderer.invoke('get-briefings-list'),
  getBriefingArticles: (briefingId: number) =>
    ipcRenderer.invoke('get-briefing-articles', briefingId),

  // Article interactions
  getArticleInteractions: (articleUrls: string[]) =>
    ipcRenderer.invoke('get-article-interactions', articleUrls),

  // Summary operations
  getSummary: (briefingId: number) =>
    ipcRenderer.invoke('get-summary', briefingId),

  generateSummary: (briefingId: number) =>
    ipcRenderer.invoke('generate-summary', briefingId),

  onSummaryReady: (callback: (briefingId: number) => void) => {
    ipcRenderer.on('summary-ready', (_, briefingId) => callback(briefingId));
    return () => ipcRenderer.removeAllListeners('summary-ready');
  },

  onBriefingCreated: (callback: (briefingId: number) => void) => {
    ipcRenderer.on('briefing-created', (_, briefingId) => callback(briefingId));
    return () => ipcRenderer.removeAllListeners('briefing-created');
  },

  getSummaryStats: () => ipcRenderer.invoke('get-summary-stats'),

  // Refresh operations
  forceRefresh: () => ipcRenderer.invoke('force-refresh'),
  getCooldownStatus: () => ipcRenderer.invoke('get-cooldown-status'),

  // Settings management
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<UserSettings>) =>
    ipcRenderer.invoke('settings:update', settings),
  getSetting: (key: keyof UserSettings) =>
    ipcRenderer.invoke('settings:get-setting', key),
  setSetting: (key: keyof UserSettings, value: string | boolean) =>
    ipcRenderer.invoke('settings:set-setting', key, value),

  // Scheduler testing
  triggerManualBriefing: () => ipcRenderer.invoke('scheduler:trigger-manual'),

  // App-level controls
  resetApp: () => ipcRenderer.invoke('app:reset'),

  // Progress tracking
  onWorkflowProgress: (callback: (progress: {
    currentStep: string;
    totalSteps: number;
    stepIndex: number;
    stepName: string;
    status: 'starting' | 'in_progress' | 'completed' | 'error';
    message?: string;
    timestamp: string;
  }) => void) => {
    ipcRenderer.on('workflow-progress', (_, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('workflow-progress');
  },

  // Test progress functionality
  triggerTestProgress: () => ipcRenderer.invoke('trigger-test-progress'),
};

console.log('🔧 API object created:', Object.keys(API));

try {
  // Expose the API to the renderer process
  contextBridge.exposeInMainWorld('electronAPI', API);
  console.log('🔧 electronAPI exposed to main world successfully');
} catch (error) {
  console.error('🔧 Error exposing electronAPI:', error);
}

// Also try to set it directly as a fallback (for debugging)
if (typeof window !== 'undefined') {
  (window as any).electronAPI = API;
  console.log('🔧 electronAPI set directly on window as fallback');
}

// Export the type for TypeScript
export type ElectronAPI = typeof API;
