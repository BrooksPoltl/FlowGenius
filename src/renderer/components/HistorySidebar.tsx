/**
 * HistorySidebar Component - Displays a list of past news briefings
 * Allows users to click on briefings to view historical articles
 */

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, ChevronRight } from 'lucide-react';
import type { Article } from '../../shared/types';

interface Briefing {
  id: number;
  title: string;
  created_at: string;
  article_count: number;
}

interface HistorySidebarProps {
  onBriefingSelect: (
    articles: Article[] | null,
    briefingId: number | null
  ) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function HistorySidebar({
  onBriefingSelect,
  isLoading,
  setIsLoading,
  setError,
}: HistorySidebarProps) {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedBriefingId, setSelectedBriefingId] = useState<number | null>(
    null
  );
  const [isLoadingBriefings, setIsLoadingBriefings] = useState(true);

  /**
   * Loads the list of briefings from the backend
   */
  const loadBriefings = async () => {
    try {
      setIsLoadingBriefings(true);
      setError(null);

      const result = await window.electronAPI.getBriefingsList();

      if (result.success && result.data) {
        setBriefings(result.data);
      } else {
        setError(result.error || 'Failed to load briefings');
      }
    } catch (err) {
      console.error('Error loading briefings:', err);
      setError('Failed to load briefings');
    } finally {
      setIsLoadingBriefings(false);
    }
  };

  /**
   * Loads articles for a specific briefing
   */
  const loadBriefingArticles = async (briefingId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedBriefingId(briefingId);

      const result = await window.electronAPI.getBriefingArticles(briefingId);

      if (result.success && result.data) {
        // Map the database articles to our Article interface
        const mappedArticles: Article[] = result.data.map((article: any) => ({
          id: article.id,
          title: article.title,
          url: article.url,
          description: article.description || '',
          source: article.source || 'Unknown',
          publishedAt: article.published_at,
          thumbnail_url: article.thumbnail_url,
          score: article.personalization_score,
        }));

        onBriefingSelect(mappedArticles, briefingId);
      } else {
        setError(result.error || 'Failed to load briefing articles');
      }
    } catch (err) {
      console.error('Error loading briefing articles:', err);
      setError('Failed to load briefing articles');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formats the briefing date for display
   */
  const formatBriefingDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    }
    if (diffDays === 2) {
      return 'Yesterday';
    }
    if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  useEffect(() => {
    loadBriefings();

    // Listen for new briefings being created
    const unsubscribe = window.electronAPI.onBriefingCreated(briefingId => {
      console.log(
        `📢 [RENDERER] New briefing created: ${briefingId}, refreshing list and auto-selecting`
      );
      loadBriefings();
      
      // Auto-select the new briefing after a brief delay to ensure list is updated
      setTimeout(() => {
        console.log(`📢 [RENDERER] Auto-selecting new briefing ${briefingId}`);
        loadBriefingArticles(briefingId);
      }, 500);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">Past news briefings</p>
      </div>



      {/* Briefings List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingBriefings && (
          <div className="p-4 text-center text-gray-500">
            Loading briefings...
          </div>
        )}

        {!isLoadingBriefings && briefings.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No briefings yet</p>
            <p className="text-xs mt-1">
              Create your first briefing by fetching news
            </p>
          </div>
        )}

        {!isLoadingBriefings && briefings.length > 0 && (
          <div className="space-y-1 p-2">
            {briefings.map(briefing => (
              <button
                key={briefing.id}
                onClick={() => loadBriefingArticles(briefing.id)}
                disabled={isLoading}
                className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedBriefingId === briefing.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {briefing.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatBriefingDate(briefing.created_at)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {briefing.article_count} articles
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={loadBriefings}
          disabled={isLoadingBriefings}
          className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoadingBriefings ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
