import { contextBridge, ipcRenderer } from 'electron';

declare global {
  interface Window {
    electronAPI: typeof API;
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,

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
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', API);

// Export the type for TypeScript
export type ElectronAPI = typeof API;
