/**
 * InterestsModal Component - Modal for managing user interests
 * Allows users to view, add, and delete their interests
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { RecommendedTopics } from './RecommendedTopics';

interface InterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InterestsModal({ isOpen, onClose }: InterestsModalProps) {
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads interests from the backend
   */
  const loadInterests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await window.electronAPI.getInterests();

      if (result.success) {
        setInterests(result.data || []);
      } else {
        setError(result.error || 'Failed to load interests');
      }
    } catch (err) {
      console.error('Error loading interests:', err);
      setError('Failed to load interests');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adds a new interest
   */
  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInterest = newInterest.trim();
    if (!trimmedInterest) return;

    if (interests.includes(trimmedInterest)) {
      setError('Interest already exists');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await window.electronAPI.addInterest(trimmedInterest);

      if (result.success) {
        setInterests([...interests, trimmedInterest]);
        setNewInterest('');
      } else {
        setError(result.error || 'Failed to add interest');
      }
    } catch (err) {
      console.error('Error adding interest:', err);
      setError('Failed to add interest');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Deletes an interest
   */
  const handleDeleteInterest = async (interestToDelete: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await window.electronAPI.deleteInterest(interestToDelete);

      if (result.success) {
        setInterests(
          interests.filter(interest => interest !== interestToDelete)
        );
      } else {
        setError(result.error || 'Failed to delete interest');
      }
    } catch (err) {
      console.error('Error deleting interest:', err);
      setError('Failed to delete interest');
    } finally {
      setIsLoading(false);
    }
  };

  // Load interests when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInterests();
    }
  }, [isOpen]);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setNewInterest('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Interests
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Add Interest Form */}
          <form onSubmit={handleAddInterest} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                placeholder="Enter a new interest..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !newInterest.trim()}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </form>

          {/* Topic Recommendations */}
          <div className="mb-6">
            <RecommendedTopics onTopicAdded={loadInterests} />
          </div>

          {/* Interests List */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Your Interests ({interests.length})
            </h3>

            {isLoading && interests.length === 0 && (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            )}

            {!isLoading && interests.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No interests added yet. Add your first interest above!
              </div>
            )}

            {interests.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {interests.map(interest => (
                  <div
                    key={interest}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <span className="text-gray-900">{interest}</span>
                    <button
                      onClick={() => handleDeleteInterest(interest)}
                      disabled={isLoading}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
