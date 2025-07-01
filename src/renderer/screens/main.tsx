import { Newspaper, Settings, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { ArticleCard, Article } from 'renderer/components/ui/ArticleCard';
import { InterestsModal } from 'renderer/components/InterestsModal';

// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

export function MainScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);
  const [newsStats, setNewsStats] = useState<{
    savedCount: number;
    duplicateCount: number;
  } | null>(null);

  const handleGetNews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching daily news...');
      const response = await App.getDailyNews();

      if (response.success) {
        setArticles(response.articles);
        setNewsStats({
          savedCount: response.savedCount,
          duplicateCount: response.duplicateCount,
        });

        if (response.errors && response.errors.length > 0) {
          console.warn('Some search errors occurred:', response.errors);
        }
      } else {
        setError(response.error || 'Failed to fetch news');
      }
    } catch (err) {
      setError('Failed to fetch news. Please try again.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestsUpdated = () => {
    // Clear current articles when interests are updated
    setArticles([]);
    setNewsStats(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">
                FlowGenius News
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsInterestsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings size={18} />
                Manage Interests
              </button>

              <button
                onClick={handleGetNews}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  size={18}
                  className={loading ? 'animate-spin' : ''}
                />
                {loading ? 'Fetching...' : 'Get Latest News'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        {newsStats && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Found {newsStats.savedCount} new articles
              {newsStats.duplicateCount > 0 &&
                ` (${newsStats.duplicateCount} duplicates skipped)`}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Articles */}
        {articles.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Latest News ({articles.length} articles)
            </h2>
            <div className="space-y-4">
              {articles.map((article, index) => (
                <ArticleCard
                  key={`${article.url}-${index}`}
                  article={article}
                />
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <Newspaper className="mx-auto text-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No articles yet
              </h2>
              <p className="text-gray-500 mb-6">
                Click &quot;Get Latest News&quot; to fetch articles based on
                your interests.
              </p>
              <button
                onClick={() => setIsInterestsModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Manage your interests first
              </button>
            </div>
          )
        )}
      </div>

      {/* Interests Modal */}
      <InterestsModal
        isOpen={isInterestsModalOpen}
        onClose={() => setIsInterestsModalOpen(false)}
        onInterestsUpdated={handleInterestsUpdated}
      />
    </main>
  );
}
