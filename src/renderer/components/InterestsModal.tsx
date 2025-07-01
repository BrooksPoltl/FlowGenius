/**
 * InterestsModal Component - Manages user interests
 * Allows users to view, add, and delete their interests
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface InterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInterestsUpdated?: () => void;
}

export function InterestsModal({
  isOpen,
  onClose,
  onInterestsUpdated,
}: InterestsModalProps) {
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load interests when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInterests();
    }
  }, [isOpen]);

  const loadInterests = async () => {
    try {
      setLoading(true);
      setError(null);
      const userInterests = await window.App.getInterests();
      setInterests(userInterests);
    } catch (err) {
      setError('Failed to load interests');
      console.error('Error loading interests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newInterest.trim()) return;

    try {
      setError(null);
      const success = await window.App.addInterest(newInterest.trim());

      if (success) {
        setNewInterest('');
        await loadInterests(); // Reload the list
        onInterestsUpdated?.();
      } else {
        setError('Interest already exists or could not be added');
      }
    } catch (err) {
      setError('Failed to add interest');
      console.error('Error adding interest:', err);
    }
  };

  const handleDeleteInterest = async (topic: string) => {
    try {
      setError(null);
      const success = await window.App.deleteInterest(topic);

      if (success) {
        await loadInterests(); // Reload the list
        onInterestsUpdated?.();
      } else {
        setError('Failed to delete interest');
      }
    } catch (err) {
      setError('Failed to delete interest');
      console.error('Error deleting interest:', err);
    }
  };

  const handleClose = () => {
    setNewInterest('');
    setError(null);
    onClose();
  };

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
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add new interest form */}
          <form onSubmit={handleAddInterest} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                placeholder="Add new interest..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <button
                type="submit"
                disabled={!newInterest.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-4">
              <div className="text-gray-500">Loading interests...</div>
            </div>
          )}

          {/* Interests list */}
          {!loading && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Current Interests ({interests.length})
              </h3>

              {interests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No interests added yet. Add some topics you&apos;d like to
                  follow!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {interests.map(interest => (
                    <div
                      key={interest}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <span className="text-gray-900">{interest}</span>
                      <button
                        onClick={() => handleDeleteInterest(interest)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title={`Delete ${interest}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
