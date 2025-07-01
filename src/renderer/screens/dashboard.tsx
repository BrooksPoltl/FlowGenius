/**
 * Dashboard Screen - Analytics and insights for the personalization system
 * Shows topic affinities, article stats, and user interaction history
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Heart,
  ThumbsDown,
  MousePointer,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface TopicAffinity {
  topicName: string;
  affinityScore: number;
  interactionCount: number;
}

interface ArticleStats {
  totalArticles: number;
  duplicatesFiltered: number;
  uniqueArticles: number;
  topicsExtracted: number;
}

interface InteractionStats {
  totalLikes: number;
  totalDislikes: number;
  totalClicks: number;
  totalInteractions: number;
}

interface RecentInteraction {
  articleTitle: string;
  interactionType: string;
  timestamp: string;
}

export function DashboardScreen() {
  const [topicAffinities, setTopicAffinities] = useState<TopicAffinity[]>([]);
  const [articleStats, setArticleStats] = useState<ArticleStats | null>(null);
  const [interactionStats, setInteractionStats] =
    useState<InteractionStats | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<
    RecentInteraction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches all dashboard data
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    // Retry mechanism for electronAPI availability
    const waitForElectronAPI = async (
      maxRetries = 5,
      delay = 100
    ): Promise<boolean> => {
      for (let i = 0; i < maxRetries; i++) {
        if (
          window.electronAPI &&
          typeof window.electronAPI.getDashboardData === 'function'
        ) {
          return true;
        }
        console.log(
          `🔧 Waiting for electronAPI... attempt ${i + 1}/${maxRetries}`
        );
        await new Promise<void>(resolve => {
          setTimeout(resolve, delay);
        });
      }
      return false;
    };

    try {
      // Debug logging
      console.log('Window object:', window);
      console.log('electronAPI available:', !!window.electronAPI);
      console.log(
        'electronAPI methods:',
        window.electronAPI ? Object.keys(window.electronAPI) : 'N/A'
      );
      console.log(
        'getDashboardData method:',
        !!window.electronAPI?.getDashboardData
      );

      // Wait for electronAPI to be available
      const apiAvailable = await waitForElectronAPI();

      if (!apiAvailable) {
        throw new Error(
          'Dashboard API not available. Please restart the application.'
        );
      }

      const result = await window.electronAPI.getDashboardData();

      if (result.success && result.data) {
        setTopicAffinities(result.data.topicAffinities || []);
        setArticleStats(result.data.articleStats || null);
        setInteractionStats(result.data.interactionStats || null);
        setRecentInteractions(result.data.recentInteractions || []);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Formats affinity score for display
   */
  const formatAffinityScore = (score: number): string => {
    return score.toFixed(2);
  };

  /**
   * Gets color for affinity score
   */
  const getAffinityColor = (score: number): string => {
    if (score > 0.5) return 'text-green-600 bg-green-50';
    if (score > 0) return 'text-blue-600 bg-blue-50';
    if (score > -0.5) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  /**
   * Gets bar width percentage for affinity visualization
   */
  const getAffinityBarWidth = (score: number): number => {
    // Normalize score (-2 to 2) to percentage (0 to 100)
    return Math.max(0, Math.min(100, ((score + 2) / 4) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Analytics Dashboard
              </h2>
              <span className="text-sm text-gray-500">
                Personalization Insights
              </span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Articles Stats */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Articles
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {articleStats?.totalArticles || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Likes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Likes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {interactionStats?.totalLikes || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Dislikes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ThumbsDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Dislikes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {interactionStats?.totalDislikes || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Clicks */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <MousePointer className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Clicks
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {interactionStats?.totalClicks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Affinities */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Topic Affinities
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              How much you like different topics (learned from your
              interactions)
            </p>
          </div>
          <div className="p-6">
            {topicAffinities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No topic affinities yet. Interact with articles to build your
                preferences!
              </p>
            ) : (
              <div className="space-y-4">
                {topicAffinities.slice(0, 20).map(topic => (
                  <div
                    key={topic.topicName}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {topic.topicName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getAffinityColor(topic.affinityScore)}`}
                          >
                            {formatAffinityScore(topic.affinityScore)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {topic.interactionCount} interactions
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            topic.affinityScore > 0
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${getAffinityBarWidth(topic.affinityScore)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Article & Interaction Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Article Statistics */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Article Statistics
              </h2>
            </div>
            <div className="p-6">
              {articleStats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Total Articles Fetched
                    </span>
                    <span className="font-semibold">
                      {articleStats.totalArticles}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duplicates Filtered</span>
                    <span className="font-semibold text-orange-600">
                      {articleStats.duplicatesFiltered}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Unique Articles</span>
                    <span className="font-semibold text-green-600">
                      {articleStats.uniqueArticles}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Topics Extracted</span>
                    <span className="font-semibold text-blue-600">
                      {articleStats.topicsExtracted}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No article statistics available</p>
              )}
            </div>
          </div>

          {/* Recent Interactions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Interactions
              </h2>
            </div>
            <div className="p-6">
              {recentInteractions.length === 0 ? (
                <p className="text-gray-500">No interactions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentInteractions.slice(0, 10).map((interaction, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {interaction.interactionType === 'like' && (
                        <Heart className="h-4 w-4 text-green-600" />
                      )}
                      {interaction.interactionType === 'dislike' && (
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                      )}
                      {interaction.interactionType === 'click' && (
                        <MousePointer className="h-4 w-4 text-purple-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {interaction.articleTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(interaction.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
