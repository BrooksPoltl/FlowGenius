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
    };
  }
}
