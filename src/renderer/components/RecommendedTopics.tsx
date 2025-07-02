/**
 * RecommendedTopics Component - Displays AI-powered topic recommendations
 * This component shows topics the user might be interested in based on their interactions
 */

import React, { useState, useEffect } from 'react';

interface TopicRecommendation {
  topicId: number;
  topicName: string;
  affinityScore: number;
  interactionCount: number;
}

interface RecommendedTopicsProps {
  onTopicAdded?: () => void; // Callback when a topic is successfully added
}

/**
 * RecommendedTopics component that fetches and displays topic recommendations
 * @param onTopicAdded - Optional callback when a topic is added
 */
export function RecommendedTopics({ onTopicAdded }: RecommendedTopicsProps) {
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingTopics, setAddingTopics] = useState<Set<number>>(new Set());

  /**
   * Fetches topic recommendations from the backend
   */
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await window.electronAPI.getTopicRecommendations();

      if (response.success) {
        setRecommendations(response.data || []);
      } else {
        setError(response.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles adding a recommended topic to user's interests
   * @param topicName - Name of the topic to add
   * @param topicId - ID of the topic being added
   */
  const handleAddTopic = async (topicName: string, topicId: number) => {
    try {
      setAddingTopics(prev => new Set(prev).add(topicId));

      const response = await window.electronAPI.addInterest(topicName);

      if (response.success) {
        // Remove the added topic from recommendations
        setRecommendations(prev => prev.filter(rec => rec.topicId !== topicId));

        // Call the callback if provided
        if (onTopicAdded) {
          onTopicAdded();
        }
      } else {
        console.error('Failed to add topic:', response.error);
        setError('Failed to add topic');
      }
    } catch (err) {
      console.error('Error adding topic:', err);
      setError('Failed to add topic');
    } finally {
      setAddingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  // Fetch recommendations on component mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          Suggestions for You
        </h3>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <span className="ml-2 text-sm text-gray-500">
            Loading suggestions...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          Suggestions for You
        </h3>
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          Suggestions for You
        </h3>
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          No recommendations available yet. Like more articles to get
          personalized suggestions!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Suggestions for You</h3>
      <div className="text-xs text-gray-500 mb-2">
        Based on your liked articles
      </div>
      <div className="space-y-2">
        {recommendations.map(rec => (
          <div
            key={rec.topicId}
            className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {rec.topicName}
              </div>
              <div className="text-xs text-gray-500">
                {rec.interactionCount} interactions •{' '}
                {rec.affinityScore.toFixed(2)} affinity
              </div>
            </div>
            <button
              onClick={() => handleAddTopic(rec.topicName, rec.topicId)}
              disabled={addingTopics.has(rec.topicId)}
              className="ml-3 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {addingTopics.has(rec.topicId) ? 'Adding...' : 'Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
