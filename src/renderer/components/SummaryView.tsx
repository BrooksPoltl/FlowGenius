/**
 * SummaryView: Displays AI-generated executive summaries
 * Handles loading, display, and error states for briefing summaries
 */

import React, { useState, useEffect, useCallback } from 'react';
// Icons from lucide-react would be imported here if needed

interface ExecutiveSummary {
  title: string;
  subtitle: string;
  mainStories: MainStory[];
  quickBites: QuickBite[];
  images: SummaryImage[];
  citations: Citation[];
  generatedAt: string;
}

interface MainStory {
  headline: string;
  summary: string;
  keyTakeaway: string;
  citations: string[];
}

interface QuickBite {
  headline: string;
  oneLineSummary: string;
  citation: string;
}

interface SummaryImage {
  url: string;
  caption: string;
  sourceUrl: string;
}

interface Citation {
  url: string;
  title: string;
  source: string;
  thumbnail_url?: string;
}

interface SummaryViewProps {
  briefingId: number | null;
  summaryReady: boolean;
}

export function SummaryView({ briefingId, summaryReady }: SummaryViewProps) {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load summary from the backend
   */
  const loadSummary = useCallback(async () => {
    if (!briefingId) {
      setSummary(null);
      setError('No briefing selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`📋 [RENDERER] Loading summary for briefing ${briefingId}`);
      const result = await window.electronAPI.getSummary(briefingId);

      if (result) {
        console.log(`📋 [RENDERER] Summary loaded successfully:`, result);
        setSummary(result);
      } else {
        console.log(
          `📋 [RENDERER] No summary found for briefing ${briefingId}`
        );
        setError('No summary available for this briefing yet');
      }
    } catch (err) {
      console.error('📋 [RENDERER] Error loading summary:', err);
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [briefingId]);

  /**
   * Handles link clicks and tracks interaction analytics
   */
  const handleLinkClick = async (url: string, event: React.MouseEvent) => {
    try {
      // Track click interaction for analytics
      await window.electronAPI.handleInteraction(url, 'click');
      console.log(`📊 [RENDERER] Tracked click interaction for: ${url}`);
    } catch (error) {
      console.error('📊 [RENDERER] Error tracking link click:', error);
      // Don't prevent the link from opening if tracking fails
    }
  };

  // Load summary when briefingId changes or when summaryReady becomes true
  useEffect(() => {
    if (briefingId) {
      loadSummary();
    }
  }, [briefingId, summaryReady, loadSummary]);

  if (!briefingId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Briefing Selected
          </h3>
          <p className="text-gray-500">
            Select articles from the Articles tab to view the executive summary
            here.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading executive summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Summary Not Ready
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadSummary}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Generating Summary
          </h3>
          <p className="text-gray-500">
            Our AI is crafting your personalized executive summary. This usually
            takes a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {summary.title}
          </h1>
          <p className="text-xl text-gray-600 mb-4">{summary.subtitle}</p>
          <div className="text-sm text-gray-500">
            Generated on{' '}
            {new Date(summary.generatedAt).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </header>

        {/* Main Stories */}
        {summary.mainStories && summary.mainStories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Top Stories
            </h2>
            <div className="space-y-6">
              {summary.mainStories.map((story, index) => (
                <article
                  key={index}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {story.headline}
                  </h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {story.summary}
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <p className="text-blue-800 font-medium">
                      Key Takeaway: {story.keyTakeaway}
                    </p>
                  </div>
                  {story.citations && story.citations.length > 0 && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Sources: </span>
                      {story.citations.map((citation, citIndex) => (
                        <a
                          key={citIndex}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                          onClick={(event) => handleLinkClick(citation, event)}
                        >
                          {new URL(citation).hostname}
                          {citIndex < story.citations.length - 1 && ', '}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Quick Bites */}
        {summary.quickBites && summary.quickBites.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Bites
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {summary.quickBites.map((bite, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {bite.headline}
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    {bite.oneLineSummary}
                  </p>
                  <a
                    href={bite.citation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    onClick={(event) => handleLinkClick(bite.citation, event)}
                  >
                    {new URL(bite.citation).hostname}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Citations */}
        {summary.citations && summary.citations.length > 0 && (
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              All Sources
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {summary.citations.map((citation, index) => (
                <a
                  key={index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                  onClick={(event) => handleLinkClick(citation.url, event)}
                >
                  {/* Thumbnail */}
                  {citation.thumbnail_url && (
                    <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={citation.thumbnail_url}
                        alt={citation.title}
                        className="w-full h-full object-cover"
                        onError={e => {
                          // Hide image if it fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {citation.title}
                    </p>
                    <p className="text-xs text-gray-500">{citation.source}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
