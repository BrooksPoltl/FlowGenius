/**
 * ArticleCard Component - Displays a single news article
 * Shows article title, source, description, and optional thumbnail
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';

export interface Article {
  title: string;
  url: string;
  description: string;
  source: string;
  published_at?: string;
  thumbnail?: string;
  personalizationScore?: number;
}

interface ArticleCardProps {
  article: Article;
}

/**
 * ArticleCard component that displays a news article with interaction buttons
 * Supports like, dislike, and click-through tracking for personalization
 */
export function ArticleCard({ article }: ArticleCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handles article click-through and tracks interaction
   */
  const handleArticleClick = async () => {
    try {
      // Track click interaction
      await window.electronAPI.handleInteraction(article.url, 'click');

      // Open article in external browser
      window.open(article.url, '_blank');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still open the article even if tracking fails
      window.open(article.url, '_blank');
    }
  };

  /**
   * Handles like button click
   */
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent article click

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Toggle like state
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      // If we're liking and it was previously disliked, remove dislike
      if (newLikedState && isDisliked) {
        setIsDisliked(false);
      }

      // Send interaction to backend
      if (newLikedState) {
        await window.electronAPI.handleInteraction(article.url, 'like');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      // Revert state on error
      setIsLiked(!isLiked);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles dislike button click
   */
  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent article click

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Toggle dislike state
      const newDislikedState = !isDisliked;
      setIsDisliked(newDislikedState);

      // If we're disliking and it was previously liked, remove like
      if (newDislikedState && isLiked) {
        setIsLiked(false);
      }

      // Send interaction to backend
      if (newDislikedState) {
        await window.electronAPI.handleInteraction(article.url, 'dislike');
      }
    } catch (error) {
      console.error('Error handling dislike:', error);
      // Revert state on error
      setIsDisliked(!isDisliked);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (Number.isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Thumbnail */}
      {article.thumbnail && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={e => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header with source and date */}
        <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
          <span className="font-medium">{article.source}</span>
          <span>{formatDate(article.published_at)}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {article.description}
        </p>

        {/* Personalization Score (for debugging) */}
        {article.personalizationScore !== undefined &&
          article.personalizationScore > 0 && (
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Score: {article.personalizationScore.toFixed(2)}
              </span>
            </div>
          )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          {/* Interaction buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              disabled={isProcessing}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isLiked
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp size={16} />
              <span>Like</span>
            </button>

            <button
              onClick={handleDislike}
              disabled={isProcessing}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isDisliked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown size={16} />
              <span>Dislike</span>
            </button>
          </div>

          {/* Read article button */}
          <button
            onClick={handleArticleClick}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <span>Read Article</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
