/**
 * ArticlesView: Displays curated articles in the main content area
 * Handles article loading, display, and interaction tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArticleCard, Article as CardArticle } from './ui/ArticleCard';
import { Category } from '../../shared/types';

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  score?: number;
}

interface ArticlesViewProps {
  onBriefingChange: (briefingId: number | null) => void;
  selectedArticles?: CardArticle[] | null;
  selectedBriefingId?: number | null;
  onClearSelection?: () => void;
}

export function ArticlesView({
  onBriefingChange,
  selectedArticles,
  selectedBriefingId,
  onClearSelection,
}: ArticlesViewProps) {
  console.log('🔍 [RENDERER] ArticlesView component rendering...');

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentBriefingId, setCurrentBriefingId] = useState<number | null>(
    null
  );
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [cooldownStatus, setCooldownStatus] = useState<{
    scheduled: string[];
    cooledDown: string[];
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [newBriefingNotification, setNewBriefingNotification] = useState<{
    show: boolean;
    briefingId: number | null;
  }>({ show: false, briefingId: null });

  /**
   * Load latest articles from the current briefing
   */
  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [RENDERER] Starting loadArticles...');
      console.log(
        '🔍 [RENDERER] window.electronAPI exists:',
        !!window.electronAPI
      );

      // Test if electronAPI is available
      if (!window.electronAPI) {
        throw new Error('electronAPI is not available');
      }

      console.log(
        '🔍 [RENDERER] electronAPI methods:',
        Object.keys(window.electronAPI)
      );
      console.log('🔍 [RENDERER] Calling getLatestBriefing...');

      const briefingResponse = await window.electronAPI.getLatestBriefing();
      console.log(
        '📰 [RENDERER] Briefing response:',
        JSON.stringify(briefingResponse, null, 2)
      );

      if (
        briefingResponse &&
        briefingResponse.success &&
        briefingResponse.data
      ) {
        const briefing = briefingResponse.data;
        console.log(
          '📰 [RENDERER] Found briefing:',
          JSON.stringify(briefing, null, 2)
        );

        // Get articles for this briefing
        console.log(
          '📰 [RENDERER] Getting articles for briefing ID:',
          briefing.id
        );
        console.log('📰 [RENDERER] Calling getBriefingArticles...');

        const articlesResponse = await window.electronAPI.getBriefingArticles(
          briefing.id
        );
        console.log(
          '📰 [RENDERER] Articles response:',
          JSON.stringify(articlesResponse, null, 2)
        );

        if (
          articlesResponse &&
          articlesResponse.success &&
          articlesResponse.data
        ) {
          console.log(
            '📰 [RENDERER] Articles response successful, data length:',
            articlesResponse.data.length
          );

          const articlesData = articlesResponse.data.map(
            (article: any, index: number) => ({
              id: article.url || index.toString(),
              title: article.title,
              description: article.description,
              url: article.url,
              imageUrl: article.thumbnail_url,
              publishedAt: article.published_at,
              source: article.source,
              score: article.personalization_score,
            })
          );

          console.log(
            '📰 [RENDERER] Mapped articles data:',
            articlesData.length,
            'articles'
          );
          console.log(
            '📰 [RENDERER] First mapped article:',
            JSON.stringify(articlesData[0], null, 2)
          );

          setArticles(articlesData);
          setLastUpdated(briefing.created_at);
          setCurrentBriefingId(briefing.id);
          onBriefingChange(briefing.id);

          console.log('📰 [RENDERER] Successfully set articles state');
        } else {
          console.log(
            '📰 [RENDERER] No articles found for briefing, response details:',
            {
              exists: !!articlesResponse,
              success: articlesResponse?.success,
              hasData: !!articlesResponse?.data,
              dataLength: articlesResponse?.data?.length,
            }
          );
          setArticles([]);
          setLastUpdated(null);
          setCurrentBriefingId(null);
          onBriefingChange(null);
        }
      } else {
        console.log(
          '📰 [RENDERER] No briefing found or briefing response failed, response details:',
          {
            exists: !!briefingResponse,
            success: briefingResponse?.success,
            hasData: !!briefingResponse?.data,
            error: briefingResponse?.error,
          }
        );
        setArticles([]);
        setLastUpdated(null);
        setCurrentBriefingId(null);
        onBriefingChange(null);
      }
    } catch (error) {
      console.error('❌ [RENDERER] Error loading articles:', error);
      console.error(
        '❌ [RENDERER] Error stack:',
        error instanceof Error ? error.stack : 'No stack'
      );
      setError(
        `Failed to load articles: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      console.log(
        '🔍 [RENDERER] loadArticles finished, setting loading to false'
      );
      setLoading(false);
    }
  }, [onBriefingChange]);

  /**
   * Check cooldown status for user interests
   */
  const checkCooldownStatus = useCallback(async () => {
    try {
      const result = await window.electronAPI.getCooldownStatus();
      if (result.success && result.data) {
        setCooldownStatus(result.data);
      }
    } catch (error) {
      console.error('Error checking cooldown status:', error);
    }
  }, []);

  /**
   * Trigger news curation workflow
   */
  const handleCurateNews = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        `🔄 [RENDERER] Starting news curation for category ${selectedCategoryId || 'General'}...`
      );

      // Check cooldown status before starting
      await checkCooldownStatus();

      const result = await window.electronAPI.curateNews(selectedCategoryId);
      console.log('🔄 [RENDERER] Curation result:', result);

      if (result.success) {
        // Reload articles after curation
        await loadArticles();

        // Check if any articles were found
        if (
          result.data &&
          (!result.data.curatedArticles ||
            result.data.curatedArticles.length === 0)
        ) {
          setError(
            'No articles found. Your interests might be on cooldown or no relevant articles are available.'
          );
        }
      } else {
        setError(result.error || 'Failed to curate news');
      }
    } catch (error) {
      console.error('🔄 [RENDERER] Error curating news:', error);
      setError('Failed to curate news');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Force refresh that bypasses cooldown periods
   */
  const handleForceRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [RENDERER] Starting force refresh...');
      const result = await window.electronAPI.forceRefresh();
      console.log('🔄 [RENDERER] Force refresh result:', result);

      if (result.success) {
        await loadArticles();
        // Reset cooldown status since we bypassed it
        setCooldownStatus({ scheduled: [], cooledDown: [] });

        if (
          result.data &&
          (!result.data.curatedArticles ||
            result.data.curatedArticles.length === 0)
        ) {
          setError(
            'No articles found even with force refresh. This may indicate API issues or no relevant content is available.'
          );
        }
      } else {
        setError(result.error || 'Failed to force refresh');
      }
    } catch (error) {
      console.error('🔄 [RENDERER] Error with force refresh:', error);
      setError('Failed to force refresh');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test summary generation for debugging
   */
  const handleTestSummary = async () => {
    if (!currentBriefingId) {
      console.error('No current briefing ID available');
      return;
    }

    setGeneratingSummary(true);
    try {
      console.log(
        `🧪 [RENDERER] Triggering summary generation for briefing ${currentBriefingId}`
      );
      const result =
        await window.electronAPI.generateSummary(currentBriefingId);
      console.log('🧪 [RENDERER] Summary generation result:', result);
      if (result.success) {
        console.log('🧪 [RENDERER] Summary generation started successfully');
      } else {
        console.error('🧪 [RENDERER] Summary generation failed:', result.error);
      }
    } catch (error) {
      console.error(
        '🧪 [RENDERER] Error triggering summary generation:',
        error
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Handle selected articles from sidebar or load latest articles
  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedArticles && selectedBriefingId) {
      // Use selected articles from sidebar
      console.log('🔍 [RENDERER] Using selected articles from sidebar');
      setArticles(
        selectedArticles.map((article, index) => ({
          id: article.url || index.toString(),
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.thumbnail,
          publishedAt: article.published_at || '',
          source: article.source,
          score: article.personalizationScore,
        }))
      );
      setCurrentBriefingId(selectedBriefingId);
      onBriefingChange(selectedBriefingId);
      // Don't set lastUpdated for selected articles since we don't have creation time
      setLastUpdated(null);
    } else {
      // Load latest articles
      console.log('🔍 [RENDERER] Loading latest articles');
      loadArticles();
    }
    checkCooldownStatus();
  }, [
    selectedArticles,
    selectedBriefingId,
    onBriefingChange,
    loadArticles,
    checkCooldownStatus,
  ]);

  // Listen for new briefings being created
  useEffect(() => {
    const unsubscribe = window.electronAPI.onBriefingCreated(briefingId => {
      console.log(
        `📢 [RENDERER] New briefing created: ${briefingId}, automatically switching to latest`
      );
      
      // Show notification
      setNewBriefingNotification({ show: true, briefingId });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNewBriefingNotification({ show: false, briefingId: null });
      }, 5000);
      
      // Always auto-load the latest briefing when a new one is created
      // This will clear any selected historical briefing and show the new content
      if (onClearSelection) {
        onClearSelection(); // Clear the historical selection
      }
      loadArticles(); // Load the latest briefing
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadArticles, onClearSelection]);

  /**
   * Load categories from backend
   */
  const loadCategories = async () => {
    try {
      const result = await window.electronAPI.getAllCategories();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Add a simple test to verify IPC is working
  useEffect(() => {
    console.log('🔍 [RENDERER] Component mounted, testing IPC...');
    if (window.electronAPI) {
      console.log(
        '🔍 [RENDERER] electronAPI available, testing getLatestBriefing...'
      );
      window.electronAPI
        .getLatestBriefing()
        .then(result => {
          console.log('🔍 [RENDERER] Direct IPC test result:', result);
        })
        .catch(error => {
          console.error('🔍 [RENDERER] Direct IPC test error:', error);
        });
    } else {
      console.error('🔍 [RENDERER] electronAPI not available!');
    }
  }, []);

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading articles...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto px-6">
          {error ? (
            <>
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Error Loading Articles
              </h3>
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={loadArticles}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Retrying...
                  </>
                ) : (
                  'Retry'
                )}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No articles yet
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by curating your first batch of personalized news
                articles.
              </p>
              <button
                onClick={handleCurateNews}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Curating...
                  </>
                ) : (
                  'Curate News'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* New Briefing Notification */}
      {newBriefingNotification.show && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
                             <div className="ml-3">
                 <p className="text-sm font-medium text-green-800">
                   🎉 New briefing created! Automatically loaded latest articles.
                 </p>
                 <p className="text-xs text-green-600 mt-1">
                   Check the sidebar to see all your briefings.
                 </p>
               </div>
            </div>
            <button
              onClick={() =>
                setNewBriefingNotification({ show: false, briefingId: null })
              }
              className="text-green-400 hover:text-green-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedArticles
                ? 'Historical Articles'
                : 'Your Curated Articles'}
            </h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}

            {/* Cooldown Status Indicator */}
            {cooldownStatus && (
              <div className="mt-2 flex items-center space-x-4 text-sm">
                {cooldownStatus.scheduled.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-700">
                      {cooldownStatus.scheduled.length} interests ready
                    </span>
                  </div>
                )}
                {cooldownStatus.cooledDown.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-orange-700">
                      {cooldownStatus.cooledDown.length} on cooldown
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Category Dropdown - Always visible and functional */}
            {categories.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Category:
                </label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={e =>
                    setSelectedCategoryId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">General (All Interests)</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Back to Latest button - only show when viewing historical articles */}
            {selectedArticles && onClearSelection && (
              <button
                onClick={onClearSelection}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Latest
              </button>
            )}

            {/* Test Summary button - always visible */}
            <button
              onClick={handleTestSummary}
              disabled={generatingSummary || !currentBriefingId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {generatingSummary ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                'Test Summary'
              )}
            </button>

            {/* Refresh button - always visible, disabled when viewing historical */}
            <button
              onClick={handleCurateNews}
              disabled={loading || !!selectedArticles}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              title={selectedArticles ? "Switch to 'Back to Latest' to refresh" : "Refresh articles"}
            >
              {loading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>

            {/* Force Refresh button - always visible, disabled when viewing historical */}
            <button
              onClick={handleForceRefresh}
              disabled={loading || !!selectedArticles}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              title={selectedArticles ? "Switch to 'Back to Latest' to force refresh" : "Force refresh bypasses cooldown periods and searches all interests"}
            >
              {loading ? (
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
              ) : (
                'Force'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id || index}
              article={{
                title: article.title,
                url: article.url,
                description: article.description,
                source: article.source,
                published_at: article.publishedAt,
                thumbnail: article.imageUrl,
                personalizationScore: article.score,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
