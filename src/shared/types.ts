import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import type { registerRoute } from 'lib/electron-router-dom';

export type BrowserWindowOrNull = Electron.BrowserWindow | null;

type Route = Parameters<typeof registerRoute>[0];

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id'];
  query?: Route['query'];
}

export interface WindowCreationByIPC {
  channel: string;
  window(): BrowserWindowOrNull;
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void;
}

// News curation types
export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  score?: number;
}

export interface Briefing {
  id: number;
  created_at: string;
  topics_json: string; // JSON array of topic strings
  articles_json: string; // JSON array of Article objects
  summary_json?: string; // JSON object containing executive summary
}
