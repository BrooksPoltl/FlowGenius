/**
 * Settings Screen - User preferences and configuration
 * Manages scheduling, notifications, and interest settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  Bell,
  User,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { CategoryManagement } from '../components/ui/CategoryManagement';
import { RecommendedTopics } from '../components/RecommendedTopics';

interface UserSettings {
  schedule_morning_enabled: boolean;
  schedule_morning_time: string;
  schedule_evening_enabled: boolean;
  schedule_evening_time: string;
  notifications_enabled: boolean;
  openai_api_key?: string;
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<Partial<UserSettings>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTestingScheduler, setIsTestingScheduler] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const loadAllSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsResult = await window.electronAPI.getSettings();
      if (settingsResult.success) {
        setSettings(settingsResult.data);
      }
      const interestsResult = await window.electronAPI.getInterests();
      if (interestsResult.success) {
        setInterests(interestsResult.data);
      }
    } catch (err) {
      setError('Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await window.electronAPI.updateSettings(settings);
      if (result.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    try {
      const result = await window.electronAPI.addInterest(newInterest.trim());
      if (result.success) {
        toast.success(`Interest "${newInterest.trim()}" added`);
        setNewInterest('');
        await loadAllSettings(); // Refresh
      } else {
        toast.error(result.error || 'Failed to add interest');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while adding interest.');
    }
  };

  const handleDeleteInterest = async (interest: string) => {
    try {
      const result = await window.electronAPI.deleteInterest(interest);
      if (result.success) {
        toast.success(`Interest "${interest}" deleted`);
        await loadAllSettings(); // Refresh
      } else {
        toast.error(result.error || 'Failed to delete interest');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while deleting interest.');
    }
  };

  const handleSettingChange = (
    key: keyof UserSettings,
    value: string | boolean
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testManualBriefing = async () => {
    setIsTestingScheduler(true);
    try {
      await window.electronAPI.triggerManualBriefing();
      toast.success(
        'Manual briefing triggered! You should receive a notification shortly.'
      );
    } catch (error) {
      toast.error('Failed to trigger manual briefing.');
    } finally {
      setIsTestingScheduler(false);
    }
  };

  const testNotification = async () => {
    setIsTestingNotification(true);
    try {
      const result = await window.electronAPI.sendTestNotification();
      if (result.success) {
        toast.success(
          'Test notification sent! Check your system notifications.'
        );
      } else {
        toast.error(result.error || 'Failed to send test notification.');
      }
    } catch (error) {
      toast.error('Failed to send test notification.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const requestNotificationPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const result = await window.electronAPI.requestNotificationPermission();
      if (result.success && result.data.hasPermission) {
        toast.success(
          'Notification permission granted! You can now receive notifications.'
        );
      } else {
        toast.error(
          'Notification permission was not granted. Please check your system settings.'
        );
      }
    } catch (error) {
      toast.error('Failed to request notification permission.');
    } finally {
      setIsRequestingPermission(false);
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
    <>
      <Toaster position="bottom-right" richColors />
      <div>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Settings
                </h2>
              </div>
              <button
                onClick={handleSaveSettings}
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
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.schedule_morning_enabled || false}
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
                  </div>
                  <input
                    type="time"
                    value={settings.schedule_morning_time || '08:00'}
                    onChange={e =>
                      handleSettingChange(
                        'schedule_morning_time',
                        e.target.value
                      )
                    }
                    disabled={!settings.schedule_morning_enabled}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.schedule_evening_enabled || false}
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
                  </div>
                  <input
                    type="time"
                    value={settings.schedule_evening_time || '18:00'}
                    onChange={e =>
                      handleSettingChange(
                        'schedule_evening_time',
                        e.target.value
                      )
                    }
                    disabled={!settings.schedule_evening_enabled}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    checked={settings.notifications_enabled || false}
                    onChange={e =>
                      handleSettingChange(
                        'notifications_enabled',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Desktop Notifications
                  </span>
                </label>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    {/* Request Permission Button (macOS only) */}
                    {navigator.platform.includes('Mac') && (
                      <div>
                        <button
                          onClick={requestNotificationPermission}
                          disabled={isRequestingPermission}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 mb-2"
                        >
                          {isRequestingPermission ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                          <span>
                            {isRequestingPermission
                              ? 'Requesting...'
                              : 'Request Permission'}
                          </span>
                        </button>
                        <p className="text-xs text-gray-500 mb-3">
                          macOS requires explicit permission for notifications.
                          Click to request permission.
                        </p>
                      </div>
                    )}

                    {/* Test Notification Button */}
                    <div>
                      <button
                        onClick={testNotification}
                        disabled={isTestingNotification}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {isTestingNotification ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                        <span>
                          {isTestingNotification
                            ? 'Sending...'
                            : 'Test Notification'}
                        </span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Send a test notification to check if notifications are
                        working properly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Management */}
            <CategoryManagement
              onUpdate={loadAllSettings}
              onError={toast.error}
              onSuccess={message => {
                toast.success(message);
                loadAllSettings();
              }}
            />

            {/* Interests Management */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Interests
                </h3>
              </div>
              <div className="flex space-x-3 mb-6">
                <input
                  type="text"
                  value={newInterest}
                  onChange={e => setNewInterest(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddInterest()}
                  placeholder="Add a new interest..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleAddInterest}
                  disabled={!newInterest.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>

              {/* Suggested Topics */}
              <div className="mb-6">
                <RecommendedTopics onTopicAdded={loadAllSettings} />
              </div>

              <div className="space-y-2">
                {interests.map(interest => (
                  <div
                    key={interest}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {interest}
                    </span>
                    <button
                      onClick={() => handleDeleteInterest(interest)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
