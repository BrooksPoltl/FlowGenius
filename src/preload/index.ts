import { contextBridge, ipcRenderer } from 'electron';
import os from 'os';

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

  // News curation
  getDailyNews: () => ipcRenderer.invoke('get-daily-news'),
  getLatestBriefing: () => ipcRenderer.invoke('get-latest-briefing'),
  curateNews: () => ipcRenderer.invoke('curate-news'),
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

  getSummaryStats: () => ipcRenderer.invoke('get-summary-stats'),

  // Refresh operations
  forceRefresh: () => ipcRenderer.invoke('force-refresh'),
  getCooldownStatus: () => ipcRenderer.invoke('get-cooldown-status'),

  // Settings management
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set-setting', key, value),

  // Scheduler testing
  triggerManualBriefing: () => ipcRenderer.invoke('scheduler:trigger-manual'),
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
