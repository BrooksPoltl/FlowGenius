/// <reference types="vite/client" />

import type {
  Article,
  Briefing,
  UserSettings,
  IPCResponse,
  Category,
  CategorySchedule,
} from './src/shared/types';

declare global {
  interface Window {
    electronAPI: {
      sayHelloFromBridge: () => void;
      username: string | undefined;

      // Interests management
      getInterests: () => Promise<IPCResponse<string[]>>;
      addInterest: (interest: string) => Promise<IPCResponse<void>>;
      deleteInterest: (interest: string) => Promise<IPCResponse<void>>;
      getTopicRecommendations: () => Promise<IPCResponse<string[]>>;

      // Categories management
      getAllCategories: () => Promise<IPCResponse<Category[]>>;
      createCategory: (name: string) => Promise<IPCResponse<Category>>;
      updateCategory: (
        categoryId: number,
        name: string
      ) => Promise<IPCResponse<void>>;
      deleteCategory: (categoryId: number) => Promise<IPCResponse<void>>;
      getInterestsForCategory: (
        categoryId: number
      ) => Promise<IPCResponse<string[]>>;
      setInterestsForCategory: (
        categoryId: number,
        interestNames: string[]
      ) => Promise<IPCResponse<void>>;
      getCategorySchedule: (
        categoryId: number
      ) => Promise<IPCResponse<CategorySchedule | null>>;
      setCategorySchedule: (
        categoryId: number,
        cronExpression: string,
        isEnabled: boolean
      ) => Promise<IPCResponse<void>>;

      // News curation
      getDailyNews: () => Promise<IPCResponse<Article[]>>;
      getLatestBriefing: () => Promise<IPCResponse<Briefing>>;
      curateNews: (categoryId?: number | null) => Promise<IPCResponse<void>>;
      recordArticleInteraction: (
        articleUrl: string,
        interactionType: string
      ) => Promise<IPCResponse<void>>;

      // User interactions for personalization
      handleInteraction: (
        articleUrl: string,
        interactionType: 'like' | 'dislike' | 'click'
      ) => Promise<IPCResponse<void>>;

      // Dashboard analytics
      getDashboardData: () => Promise<
        IPCResponse<{
          totalArticles: number;
          totalInterests: number;
          lastBriefingDate: string;
        }>
      >;

      // Briefings history
      getBriefingsList: () => Promise<IPCResponse<Briefing[]>>;
      getBriefingArticles: (
        briefingId: number
      ) => Promise<IPCResponse<Article[]>>;

      // Article interactions
      getArticleInteractions: (articleUrls: string[]) => Promise<
        IPCResponse<
          Record<
            string,
            {
              liked: boolean;
              disliked: boolean;
              clicked: boolean;
            }
          >
        >
      >;

      // Summary operations
      getSummary: (briefingId: number) => Promise<
        IPCResponse<{
          title: string;
          subtitle: string;
          keyStories: Array<{
            title: string;
            summary: string;
            importance: 'high' | 'medium' | 'low';
          }>;
          quickBites: Array<{
            title: string;
            summary: string;
          }>;
        }>
      >;
      generateSummary: (briefingId: number) => Promise<IPCResponse<void>>;
      onSummaryReady: (callback: (briefingId: number) => void) => () => void;
      getSummaryStats: () => Promise<
        IPCResponse<{
          totalSummaries: number;
          avgProcessingTime: number;
        }>
      >;

      // Refresh operations
      forceRefresh: () => Promise<IPCResponse<void>>;
      getCooldownStatus: () => Promise<
        IPCResponse<{
          scheduledInterests: string[];
          cooledDownInterests: string[];
        }>
      >;

      // Settings management
      getSettings: () => Promise<IPCResponse<UserSettings>>;
      updateSettings: (
        settings: Partial<UserSettings>
      ) => Promise<IPCResponse<void>>;
      getSetting: (
        key: keyof UserSettings
      ) => Promise<IPCResponse<string | boolean>>;
      setSetting: (
        key: keyof UserSettings,
        value: string | boolean
      ) => Promise<IPCResponse<void>>;

      // Scheduler testing
      triggerManualBriefing: () => Promise<IPCResponse<void>>;
    };
  }
}
