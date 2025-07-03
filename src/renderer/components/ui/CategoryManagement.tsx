/**
 * CategoryManagement Component - Manages categories and their interest assignments
 * Provides UI for creating, editing, deleting categories and managing interest assignments
 */

import React, { useState, useEffect } from 'react';
import {
  Folder,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Clock,
  Save,
  X,
} from 'lucide-react';
import { Category } from '../../../shared/types';

interface CategoryManagementProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export function CategoryManagement({
  onError,
  onSuccess,
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [managingInterests, setManagingInterests] = useState<{
    categoryId: number;
    categoryName: string;
  } | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [managingSchedule, setManagingSchedule] = useState<{
    categoryId: number;
    categoryName: string;
  } | null>(null);
  const [scheduleSettings, setScheduleSettings] = useState<{
    isEnabled: boolean;
    frequency: 'once' | 'twice';
    time1: string;
    time2: string;
  }>({
    isEnabled: false,
    frequency: 'once',
    time1: '08:00',
    time2: '18:00',
  });

  /**
   * Load categories and interests on component mount
   */
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load categories and interests from backend
   */
  const loadData = async () => {
    try {
      setLoading(true);

      const [categoriesResult, interestsResult] = await Promise.all([
        window.electronAPI.getAllCategories(),
        window.electronAPI.getInterests(),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      } else {
        onError(categoriesResult.error || 'Failed to load categories');
      }

      if (interestsResult.success) {
        setInterests(interestsResult.data);
      } else {
        onError(interestsResult.error || 'Failed to load interests');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      onError('Failed to load categories and interests');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new category
   */
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const result = await window.electronAPI.createCategory(
        newCategoryName.trim()
      );
      if (result.success) {
        setNewCategoryName('');
        await loadData();
        onSuccess('Category created successfully');
      } else {
        onError(result.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      onError('Failed to create category');
    }
  };

  /**
   * Update category name
   */
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      const result = await window.electronAPI.updateCategory(
        editingCategory.id,
        editingCategory.name.trim()
      );
      if (result.success) {
        setEditingCategory(null);
        await loadData();
        onSuccess('Category updated successfully');
      } else {
        onError(result.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      onError('Failed to update category');
    }
  };

  /**
   * Delete a category
   */
  const handleDeleteCategory = async (
    categoryId: number,
    categoryName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the "${categoryName}" category? This will remove all interest assignments and schedules for this category.`
      )
    ) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteCategory(categoryId);
      if (result.success) {
        await loadData();
        onSuccess('Category deleted successfully');
      } else {
        onError(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      onError('Failed to delete category');
    }
  };

  /**
   * Open interests management modal
   */
  const handleManageInterests = async (
    categoryId: number,
    categoryName: string
  ) => {
    try {
      const result =
        await window.electronAPI.getInterestsForCategory(categoryId);
      if (result.success) {
        setSelectedInterests(result.data);
        setManagingInterests({ categoryId, categoryName });
      } else {
        onError(result.error || 'Failed to load category interests');
      }
    } catch (error) {
      console.error('Error loading category interests:', error);
      onError('Failed to load category interests');
    }
  };

  /**
   * Save interest assignments for category
   */
  const handleSaveInterests = async () => {
    if (!managingInterests) return;

    try {
      const result = await window.electronAPI.setInterestsForCategory(
        managingInterests.categoryId,
        selectedInterests
      );
      if (result.success) {
        setManagingInterests(null);
        onSuccess('Interest assignments saved successfully');
      } else {
        onError(result.error || 'Failed to save interest assignments');
      }
    } catch (error) {
      console.error('Error saving interest assignments:', error);
      onError('Failed to save interest assignments');
    }
  };

  /**
   * Toggle interest selection
   */
  const toggleInterestSelection = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  /**
   * Open schedule management modal
   */
  const handleManageSchedule = async (
    categoryId: number,
    categoryName: string
  ) => {
    try {
      const result = await window.electronAPI.getCategorySchedule(categoryId);
      if (result.success && result.data) {
        // Parse existing schedule
        const schedule = result.data;
        setScheduleSettings({
          isEnabled: schedule.is_enabled,
          frequency: 'once', // We'll parse this from cron expression
          time1: '08:00',
          time2: '18:00',
        });
      } else {
        // Default settings for new schedule
        setScheduleSettings({
          isEnabled: false,
          frequency: 'once',
          time1: '08:00',
          time2: '18:00',
        });
      }
      setManagingSchedule({ categoryId, categoryName });
    } catch (error) {
      console.error('Error loading category schedule:', error);
      onError('Failed to load category schedule');
    }
  };

  /**
   * Save category schedule
   */
  const handleSaveSchedule = async () => {
    if (!managingSchedule) return;

    try {
      // Generate cron expression based on settings
      let cronExpression = '';
      if (scheduleSettings.frequency === 'once') {
        const [hours, minutes] = scheduleSettings.time1.split(':').map(Number);
        cronExpression = `${minutes} ${hours} * * *`;
      } else {
        // For twice a day, we'll create two separate schedules
        // For now, just use the first time
        const [hours, minutes] = scheduleSettings.time1.split(':').map(Number);
        cronExpression = `${minutes} ${hours} * * *`;
      }

      const result = await window.electronAPI.setCategorySchedule(
        managingSchedule.categoryId,
        cronExpression,
        scheduleSettings.isEnabled
      );

      if (result.success) {
        setManagingSchedule(null);
        onSuccess('Schedule settings saved successfully');
      } else {
        onError(result.error || 'Failed to save schedule settings');
      }
    } catch (error) {
      console.error('Error saving schedule settings:', error);
      onError('Failed to save schedule settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Folder className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-3 mb-6">
        <Folder className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Category Management
        </h3>
      </div>

      {/* Create New Category */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Create New Category
        </h4>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCreateCategory()}
            placeholder="Category name (e.g., Work, Sports, Local News)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleCreateCategory}
            disabled={!newCategoryName.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No categories created yet. Create your first category above.
          </p>
        ) : (
          categories.map(category => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingCategory?.id === category.id ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={e =>
                          setEditingCategory({
                            ...editingCategory,
                            name: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleUpdateCategory}
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h4 className="text-base font-medium text-gray-900">
                      {category.name}
                    </h4>
                  )}
                  <p className="text-sm text-gray-500">
                    Created {new Date(category.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handleManageInterests(category.id, category.name)
                    }
                    className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Interests</span>
                  </button>

                  <button
                    onClick={() =>
                      handleManageSchedule(category.id, category.name)
                    }
                    className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:text-green-800 text-sm"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Schedule</span>
                  </button>

                  <button
                    onClick={() =>
                      setEditingCategory({
                        id: category.id,
                        name: category.name,
                      })
                    }
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  {category.name !== 'General' && (
                    <button
                      onClick={() =>
                        handleDeleteCategory(category.id, category.name)
                      }
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manage Interests Modal */}
      {managingInterests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Interests - {managingInterests.categoryName}
              </h3>
              <button
                onClick={() => setManagingInterests(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Select which interests should be included in this category:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {interests.map(interest => (
                  <label
                    key={interest}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(interest)}
                      onChange={() => toggleInterestSelection(interest)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setManagingInterests(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterests}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Schedule Modal */}
      {managingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule Settings - {managingSchedule.categoryName}
              </h3>
              <button
                onClick={() => setManagingSchedule(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={scheduleSettings.isEnabled}
                  onChange={e =>
                    setScheduleSettings(prev => ({
                      ...prev,
                      isEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-900">
                  Enable automatic briefings for this category
                </label>
              </div>

              {scheduleSettings.isEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={scheduleSettings.frequency}
                      onChange={e =>
                        setScheduleSettings(prev => ({
                          ...prev,
                          frequency: e.target.value as 'once' | 'twice',
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="once">Once per day</option>
                      <option value="twice">Twice per day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {scheduleSettings.frequency === 'once'
                        ? 'Time'
                        : 'First time'}
                    </label>
                    <input
                      type="time"
                      value={scheduleSettings.time1}
                      onChange={e =>
                        setScheduleSettings(prev => ({
                          ...prev,
                          time1: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {scheduleSettings.frequency === 'twice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Second time
                      </label>
                      <input
                        type="time"
                        value={scheduleSettings.time2}
                        onChange={e =>
                          setScheduleSettings(prev => ({
                            ...prev,
                            time2: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setManagingSchedule(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
