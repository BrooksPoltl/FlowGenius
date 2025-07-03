/**
 * MainApp - Main application component with internal navigation
 * Handles navigation between news and dashboard screens
 * Manages shared state to persist across screen switches
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Menu, X, Settings } from 'lucide-react';

import { DashboardScreen } from '../screens/dashboard';
import { SettingsScreen } from '../screens/settings';
import { HistorySidebar } from './HistorySidebar';
import { ArticlesView } from './ArticlesView';
import { SummaryView } from './SummaryView';
import { InterestsModal } from './InterestsModal';
import { Article } from './ui/ArticleCard';

type AppScreen = 'news' | 'dashboard' | 'settings';

export function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('news');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'summary'>(
    'articles'
  );
  const [currentBriefingId, setCurrentBriefingId] = useState<number | null>(
    null
  );
  const [summaryReady, setSummaryReady] = useState(false);
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);

  // Shared state that persists across screen navigation
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Article[] | null>(
    null
  );
  const [selectedBriefingId, setSelectedBriefingId] = useState<number | null>(
    null
  );

  useEffect(() => {
    // Listen for summary ready notifications
    const unsubscribeSummary = window.electronAPI.onSummaryReady(
      (briefingId: number) => {
        if (briefingId === currentBriefingId) {
          setSummaryReady(true);
        }
      }
    );

    // Listen for new briefings being created
    const unsubscribeBriefing = window.electronAPI.onBriefingCreated(
      (briefingId: number) => {
        console.log(
          `📢 [MAIN APP] New briefing created: ${briefingId}, clearing selection and switching to latest`
        );
        // Clear any selected historical briefing
        setSelectedArticles(null);
        setSelectedBriefingId(null);
        // Switch to articles tab to show the new content
        setActiveTab('articles');
      }
    );

    return () => {
      if (typeof unsubscribeSummary === 'function') {
        unsubscribeSummary();
      }
      if (typeof unsubscribeBriefing === 'function') {
        unsubscribeBriefing();
      }
    };
  }, [currentBriefingId]);

  /**
   * Handles when a briefing is selected from the history sidebar
   */
  const handleBriefingSelect = (
    briefingArticles: Article[],
    briefingId: number
  ) => {
    console.log('Selected briefing with', briefingArticles.length, 'articles');
    setSelectedArticles(briefingArticles);
    setSelectedBriefingId(briefingId);
    setCurrentBriefingId(briefingId);
    // Switch to articles tab when a briefing is selected
    setActiveTab('articles');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">FlowGenius</h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentScreen('news')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentScreen === 'news'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <TrendingUp size={20} />
                <span>News</span>
              </button>

              <button
                onClick={() => setCurrentScreen('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentScreen === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart3 size={20} />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setCurrentScreen('settings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentScreen === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && currentScreen === 'news' && (
          <HistorySidebar
            onBriefingSelect={handleBriefingSelect}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={() => {}} // Placeholder for error handling
          />
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {currentScreen === 'news' && (
            <div className="flex-1 flex flex-col">
              {/* Tab Navigation */}
              <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-3">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab('articles')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'articles'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Articles
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('summary');
                        setSummaryReady(false); // Reset notification when viewing summary
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
                        activeTab === 'summary'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Summary
                      {summaryReady && activeTab !== 'summary' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'articles' ? (
                  <ArticlesView
                    onBriefingChange={setCurrentBriefingId}
                    selectedArticles={selectedArticles}
                    selectedBriefingId={selectedBriefingId}
                    onClearSelection={() => {
                      setSelectedArticles(null);
                      setSelectedBriefingId(null);
                    }}
                  />
                ) : (
                  <SummaryView
                    briefingId={currentBriefingId}
                    summaryReady={summaryReady}
                  />
                )}
              </div>
            </div>
          )}
          {currentScreen === 'dashboard' && <DashboardScreen />}
          {currentScreen === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Interests Management Modal */}
      <InterestsModal
        isOpen={isInterestsModalOpen}
        onClose={() => setIsInterestsModalOpen(false)}
      />
    </div>
  );
}
