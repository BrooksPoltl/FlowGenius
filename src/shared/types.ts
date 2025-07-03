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

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategorySchedule {
  id: number;
  category_id: number;
  cron_expression: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// User Settings types
export interface UserSettings {
  schedule_morning_enabled: boolean;
  schedule_morning_time: string; // HH:MM format
  schedule_evening_enabled: boolean;
  schedule_evening_time: string; // HH:MM format
  notifications_enabled: boolean;
}

// Workflow State types
export interface WorkflowState {
  // Settings phase
  userInterests: string[];
  settingsLoaded: boolean;

  // Scheduling phase
  scheduledInterests: string[];
  cooledDownInterests: string[];
  schedulingComplete: boolean;

  // Search phase
  searchResults: Article[];
  searchComplete: boolean;

  // Curation phase
  curatedArticles: Article[];
  curationComplete: boolean;
  duplicatesFiltered: number;
  newArticlesSaved: number;

  // Topic extraction phase
  topicsExtracted: boolean;
  topicsExtractedCount: number;

  // Ranking phase
  articlesRanked: boolean;
  rankedCount: number;

  // Error handling
  error?: string;

  // Optional category filter
  categoryId?: number;
}

// Database types
export interface UserSetting {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// IPC Response types
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Scheduler types
export interface ScheduledJob {
  id: string;
  cronExpression: string;
  description: string;
}

// Category with Schedule type for enhanced queries
export interface CategoryWithSchedule extends CategorySchedule {
  categoryName: string;
}
