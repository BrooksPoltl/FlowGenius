/**
 * Settings Screen - User preferences and configuration
 * Manages scheduling, notifications, and interest settings
 */

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  Bell,
  User,
  Save,
  RefreshCw,
} from 'lucide-react';
import { CategoryManagement } from '../components/ui/CategoryManagement';

interface UserSettings {
  schedule_morning_enabled: boolean;
  schedule_morning_time: string;
  schedule_evening_enabled: boolean;
  schedule_evening_time: string;
  notifications_enabled: boolean;
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    schedule_morning_enabled: true,
    schedule_morning_time: '08:00',
    schedule_evening_enabled: true,
    schedule_evening_time: '18:00',
    notifications_enabled: true,
  });
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTestingScheduler, setIsTestingScheduler] = useState(false);

  /**
   * Load settings and interests on component mount
   */
  useEffect(() => {
    loadSettings();
    loadInterests();
  }, []);

  /**
   * Load user settings from backend
   */
  const loadSettings = async () => {
    try {
      const result = await window.electronAPI.getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('An unexpected error occurred while loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load user interests from backend
   */
  const loadInterests = async () => {
    try {
      const result = await window.electronAPI.getInterests();
      if (result.success && result.data) {
        setInterests(result.data);
      }
    } catch (err) {
      console.error('Error loading interests:', err);
    }
  };

  /**
   * Save settings to backend
   */
  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await window.electronAPI.updateSettings(settings);
      if (result.success) {
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('An unexpected error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Add new interest
   */
  const addInterest = async () => {
    if (!newInterest.trim()) return;

    try {
      const result = await window.electronAPI.addInterest(newInterest.trim());
      if (result.success) {
        setInterests([...interests, newInterest.trim()]);
        setNewInterest('');
      } else {
        setError(result.error || 'Failed to add interest');
      }
    } catch (err) {
      console.error('Error adding interest:', err);
      setError('An unexpected error occurred while adding interest');
    }
  };

  /**
   * Delete interest
   */
  const deleteInterest = async (interest: string) => {
    try {
      const result = await window.electronAPI.deleteInterest(interest);
      if (result.success) {
        setInterests(interests.filter(i => i !== interest));
      } else {
        setError(result.error || 'Failed to delete interest');
      }
    } catch (err) {
      console.error('Error deleting interest:', err);
      setError('An unexpected error occurred while deleting interest');
    }
  };

  /**
   * Handle settings change
   */
  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Test manual briefing trigger
   */
  const testManualBriefing = async () => {
    setIsTestingScheduler(true);
    setError(null);

    try {
      const result = await window.electronAPI.triggerManualBriefing();
      if (result.success) {
        setSuccessMessage(
          'Manual briefing triggered! Check the console for progress.'
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.error || 'Failed to trigger manual briefing');
      }
    } catch (err) {
      console.error('Error triggering manual briefing:', err);
      setError('An unexpected error occurred while triggering manual briefing');
    } finally {
      setIsTestingScheduler(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Scheduling Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Automatic Briefings
              </h3>
            </div>

            <div className="space-y-6">
              {/* Morning Briefing */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.schedule_morning_enabled}
                      onChange={e =>
                        handleSettingChange(
                          'schedule_morning_enabled',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Morning Briefing
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 ml-7">
                    Get your daily news briefing in the morning
                  </p>
                </div>
                <input
                  type="time"
                  value={settings.schedule_morning_time}
                  onChange={e =>
                    handleSettingChange('schedule_morning_time', e.target.value)
                  }
                  disabled={!settings.schedule_morning_enabled}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Evening Briefing */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.schedule_evening_enabled}
                      onChange={e =>
                        handleSettingChange(
                          'schedule_evening_enabled',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Evening Briefing
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 ml-7">
                    Get your daily news briefing in the evening
                  </p>
                </div>
                <input
                  type="time"
                  value={settings.schedule_evening_time}
                  onChange={e =>
                    handleSettingChange('schedule_evening_time', e.target.value)
                  }
                  disabled={!settings.schedule_evening_enabled}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={e =>
                    handleSettingChange(
                      'notifications_enabled',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Desktop Notifications
                  </span>
                  <p className="text-sm text-gray-500">
                    Receive notifications when new briefings are ready
                  </p>
                </div>
              </label>

              {/* Test Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={testManualBriefing}
                  disabled={isTestingScheduler}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isTestingScheduler
                    ? 'Testing...'
                    : 'Test Briefing & Notification'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Manually trigger a briefing to test the notification system
                </p>
              </div>
            </div>
          </div>

          {/* Category Management */}
          <CategoryManagement
            onError={setError}
            onSuccess={setSuccessMessage}
          />

          {/* Interests Management */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Your Interests
              </h3>
            </div>

            {/* Add Interest */}
            <div className="flex space-x-3 mb-6">
              <input
                type="text"
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addInterest()}
                placeholder="Add a new interest..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addInterest}
                disabled={!newInterest.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Interests List */}
            <div className="space-y-2">
              {interests.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No interests added yet. Add some topics you're interested in
                  to get personalized news.
                </p>
              ) : (
                interests.map(interest => (
                  <div
                    key={interest}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {interest}
                    </span>
                    <button
                      onClick={() => deleteInterest(interest)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
