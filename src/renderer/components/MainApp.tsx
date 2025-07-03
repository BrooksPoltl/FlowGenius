/**
 * MainApp - Main application component with internal navigation
 * Handles navigation between news and dashboard screens
 * Manages shared state to persist across screen switches
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, BarChart3, Menu, X, Settings } from 'lucide-react';

import { DashboardScreen } from '../screens/dashboard';
import { SettingsScreen } from '../screens/settings';
import { HistorySidebar } from './HistorySidebar';
import { SummaryView } from './SummaryView';
import { InterestsModal } from './InterestsModal';
import type { Article } from '../../shared/types';
import { Category } from '../../shared/types';

type AppScreen = 'news' | 'dashboard' | 'settings';

export function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('news');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);
  const [currentBriefingId, setCurrentBriefingId] = useState<number | null>(
    null
  );
  const [summaryReady, setSummaryReady] = useState(false);

  // Curation and category state
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);



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

  useEffect(() => {
    loadCategories();

    const unsubscribeBriefing = window.electronAPI.onBriefingCreated(
      briefingId => {
        console.log(
          `📢 [MAIN APP] New briefing created: ${briefingId}, setting as current.`
        );
        setCurrentBriefingId(briefingId);
      }
    );

    const unsubscribeSummary = window.electronAPI.onSummaryReady(
      briefingId => {
        if (briefingId === currentBriefingId) {
          setSummaryReady(true);
        }
      }
    );

    return () => {
      if (typeof unsubscribeBriefing === 'function') {
        unsubscribeBriefing();
      }
      if (typeof unsubscribeSummary === 'function') {
        unsubscribeSummary();
      }
    };
  }, [currentBriefingId]);

  // Reload categories when switching to news screen
  useEffect(() => {
    if (currentScreen === 'news') {
      loadCategories();
    }
  }, [currentScreen]);

  /**
   * Trigger news curation workflow
   */
  const handleCurateNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await window.electronAPI.curateNews(selectedCategoryId);
      // The onBriefingCreated listener will handle setting the new briefing ID
    } catch (err) {
      console.error('🔄 [RENDERER] Error curating news:', err);
      setError('Failed to curate news. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  /**
   * Force refresh that bypasses cooldown periods
   */
  const handleForceRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await window.electronAPI.forceRefresh();
    } catch (err) {
      console.error('🔄 [RENDERER] Error with force refresh:', err);
      setError('Failed to force refresh. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles when a briefing is selected from the history sidebar
   */
  const handleBriefingSelect = (
    // Articles are no longer needed here, sidebar only provides the ID
    briefingArticles: Article[] | null,
    briefingId: number | null
  ) => {
    setCurrentBriefingId(briefingId);
    setSummaryReady(false); // Reset summary status on new selection
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center space-x-3">
              {/* Only show hamburger menu on news tab */}
              {currentScreen === 'news' && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">PulseNews</h1>
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
            setError={setError}
          />
        )}

        {/* Content */}
        <main className="flex-1 flex flex-col">
          {currentScreen === 'news' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2" />
                  {/* Right side: Category Dropdown and Action Buttons */}
                  <div className="flex items-center space-x-4">
                    {/* Category dropdown */}
                    {categories.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor="categorySelect"
                          className="text-sm font-medium text-gray-700"
                        >
                          Category
                        </label>
                        <select
                          id="categorySelect"
                          value={
                            selectedCategoryId === null
                              ? 'general'
                              : selectedCategoryId
                          }
                          onChange={e => {
                            const { value } = e.target;
                            if (value === 'general') {
                              setSelectedCategoryId(null);
                            } else {
                              setSelectedCategoryId(Number(value));
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="general">General</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {/* Refresh button - always visible and functional */}
                      <button
                        onClick={handleCurateNews}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        title="Curate fresh articles for the selected category"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Curating...
                          </>
                        ) : (
                          'Curate News'
                        )}
                      </button>

                      {/* Force Refresh button - always visible and functional */}
                      <button
                        onClick={handleForceRefresh}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        title="Force refresh bypasses cooldown periods and searches all interests"
                      >
                        {isLoading ? (
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                        ) : (
                          'Force'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <SummaryView
                  briefingId={currentBriefingId}
                  summaryReady={summaryReady}
                />
              </div>
            </div>
          ) : currentScreen === 'dashboard' ? (
            <DashboardScreen />
          ) : (
            <SettingsScreen />
          )}
        </main>
      </div>
      <InterestsModal
        isOpen={isInterestsModalOpen}
        onClose={() => setIsInterestsModalOpen(false)}
      />
    </div>
  );
}
