/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      sayHelloFromBridge: () => void;
      username: string | undefined;

      // Interests management
      getInterests: () => Promise<any>;
      addInterest: (interest: string) => Promise<any>;
      deleteInterest: (interest: string) => Promise<any>;
      getTopicRecommendations: () => Promise<any>;

      // News curation
      getDailyNews: () => Promise<any>;

      // User interactions for personalization
      handleInteraction: (
        articleUrl: string,
        interactionType: 'like' | 'dislike' | 'click'
      ) => Promise<any>;

      // Dashboard analytics
      getDashboardData: () => Promise<any>;

      // Briefings history
      getBriefingsList: () => Promise<any>;
      getBriefingArticles: (briefingId: number) => Promise<any>;

      // Article interactions
      getArticleInteractions: (articleUrls: string[]) => Promise<any>;

      // News curation workflow
      getLatestBriefing: () => Promise<any>;
      curateNews: () => Promise<any>;
      recordArticleInteraction: (articleUrl: string, interactionType: string) => Promise<any>;

      // Summary operations
      getSummary: (briefingId: number) => Promise<any>;
      generateSummary: (briefingId: number) => Promise<any>;
      onSummaryReady: (callback: (briefingId: number) => void) => () => void;
      getSummaryStats: () => Promise<any>;

      // Refresh operations
      forceRefresh: () => Promise<any>;
      getCooldownStatus: () => Promise<any>;

      // Settings management
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<any>;
      getSetting: (key: string) => Promise<any>;
      setSetting: (key: string, value: any) => Promise<any>;
    };
  }
}
