/**
 * MainApp - Main application component with internal navigation
 * Handles navigation between news and dashboard screens
 * Manages shared state to persist across screen switches
 */

import React, { useState } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';

import { MainScreen } from '../screens/main';
import { DashboardScreen } from '../screens/dashboard';
import { Article } from './ui/ArticleCard';

type AppScreen = 'news' | 'dashboard';

interface NewsStats {
  interests: number;
  searchResults: number;
  curatedArticles: number;
  duplicatesFiltered: number;
  newArticlesSaved: number;
  topicsExtracted: number;
  articlesRanked: number;
}

export function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('news');

  // Shared state that persists across screen navigation
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">FlowGenius</h1>
            </div>

            {/* Navigation Links */}
            <div className="flex space-x-1">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {currentScreen === 'news' && (
          <MainScreen
            articles={articles}
            setArticles={setArticles}
            stats={stats}
            setStats={setStats}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
          />
        )}
        {currentScreen === 'dashboard' && <DashboardScreen />}
      </main>
    </div>
  );
}
