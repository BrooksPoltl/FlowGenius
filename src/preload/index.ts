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

  // News curation
  getDailyNews: () => ipcRenderer.invoke('get-daily-news'),

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
