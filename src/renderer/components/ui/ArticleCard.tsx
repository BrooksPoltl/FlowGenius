/**
 * ArticleCard Component - Displays a single news article
 * Shows article title, source, description, and optional thumbnail
 */

import React from 'react';

export interface Article {
  title: string;
  url: string;
  description: string;
  source: string;
  published_at?: string;
  thumbnail?: string;
}

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: open article in external browser
      window.open(article.url, '_blank');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 mb-4"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={article.thumbnail}
              alt=""
              className="w-20 h-20 object-cover rounded-md"
              onError={e => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {article.title}
          </h3>

          {/* Source and Date */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="font-medium">{article.source}</span>
            {article.published_at && (
              <>
                <span>•</span>
                <span>{article.published_at}</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700 text-sm line-clamp-3">
            {article.description}
          </p>
        </div>
      </div>
    </div>
  );
}
