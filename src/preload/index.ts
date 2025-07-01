import { contextBridge, ipcRenderer } from 'electron';

declare global {
  interface Window {
    App: typeof API;
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,

  // Interests management
  getInterests: () => ipcRenderer.invoke('get-interests'),
  addInterest: (topic: string) => ipcRenderer.invoke('add-interest', topic),
  deleteInterest: (topic: string) =>
    ipcRenderer.invoke('delete-interest', topic),

  // News curation
  getDailyNews: () => ipcRenderer.invoke('get-daily-news'),
};

contextBridge.exposeInMainWorld('App', API);
