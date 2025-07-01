/**
 * Main Screen - Primary interface for the News Curator application
 * Displays personalized news articles and provides interest management
 */

import React, { useState } from 'react';
import { Settings, RefreshCw, TrendingUp } from 'lucide-react';
import { ArticleCard, Article } from '../components/ui/ArticleCard';
import { InterestsModal } from '../components/InterestsModal';

interface NewsStats {
  interests: number;
  searchResults: number;
  curatedArticles: number;
  duplicatesFiltered: number;
  newArticlesSaved: number;
  topicsExtracted: number;
  articlesRanked: number;
}

export function MainScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);

  /**
   * Fetches the latest personalized news
   */
  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.getDailyNews();

      if (result.success && result.data) {
        // Map the database articles to our Article interface
        const mappedArticles: Article[] = result.data.articles.map(
          (article: any) => ({
            title: article.title,
            url: article.url,
            description: article.description || '',
            source: article.source || 'Unknown',
            published_at: article.published_at,
            thumbnail: article.thumbnail_url,
            personalizationScore: article.personalization_score,
          })
        );

        setArticles(mappedArticles);
        setStats(result.data.stats);
      } else {
        setError(result.error || 'Failed to fetch news');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // News is now loaded manually via the "Get Latest News" button
  // No automatic loading to avoid unnecessary API calls

  return (
    <div>
      {/* Action Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Personalized News
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsInterestsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings size={20} />
                <span>Manage Interests</span>
              </button>

              <button
                onClick={fetchNews}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  size={20}
                  className={isLoading ? 'animate-spin' : ''}
                />
                <span>{isLoading ? 'Loading...' : 'Get Latest News'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-900">
                  {stats.interests}
                </span>
                <span className="text-blue-700">interests</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-900">
                  {stats.searchResults}
                </span>
                <span className="text-blue-700">articles searched</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-900">
                  {stats.duplicatesFiltered}
                </span>
                <span className="text-blue-700">duplicates filtered</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-900">
                  {stats.newArticlesSaved}
                </span>
                <span className="text-blue-700">new articles saved</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-900">
                  {stats.topicsExtracted}
                </span>
                <span className="text-blue-700">topics extracted</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-900">
                  {stats.articlesRanked}
                </span>
                <span className="text-blue-700">articles ranked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {articles.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-600 mb-4">
              Click &quot;Get Latest News&quot; to fetch personalized articles
              based on your interests.
            </p>
            <button
              onClick={fetchNews}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Articles Grid */}
        {articles.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Personalized News ({articles.length} articles)
              </h2>
              <div className="text-sm text-gray-500">
                Sorted by relevance score
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <ArticleCard
                  key={`${article.url}-${index}`}
                  article={article}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Interests Modal */}
      <InterestsModal
        isOpen={isInterestsModalOpen}
        onClose={() => setIsInterestsModalOpen(false)}
      />
    </div>
  );
}
