/**
 * User Settings Service
 * Manages user preferences for scheduling, notifications, and other app settings
 */

import db from '../db';
// UserSetting type imported but not used - removed

/**
 * Interface for user settings with typed values
 */
export interface UserSettings {
  schedule_morning_enabled: boolean;
  schedule_morning_time: string; // HH:MM format
  schedule_evening_enabled: boolean;
  schedule_evening_time: string; // HH:MM format
  notifications_enabled: boolean;
}

/**
 * Get all user settings as a typed object
 */
export function getUserSettings(): UserSettings {
  try {
    const settings = db
      .prepare('SELECT key, value FROM UserSettings')
      .all() as Array<{ key: string; value: string }>;

    const settingsMap = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      schedule_morning_enabled: settingsMap.schedule_morning_enabled === 'true',
      schedule_morning_time: settingsMap.schedule_morning_time || '08:00',
      schedule_evening_enabled: settingsMap.schedule_evening_enabled === 'true',
      schedule_evening_time: settingsMap.schedule_evening_time || '18:00',
      notifications_enabled: settingsMap.notifications_enabled === 'true',
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    // Return default settings on error
    return {
      schedule_morning_enabled: true,
      schedule_morning_time: '08:00',
      schedule_evening_enabled: true,
      schedule_evening_time: '18:00',
      notifications_enabled: true,
    };
  }
}

/**
 * Update user settings
 */
export function updateUserSettings(settings: Partial<UserSettings>): void {
  try {
    const updateStmt = db.prepare(`
      INSERT OR REPLACE INTO UserSettings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    // Convert settings to string values for storage
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'boolean' ? value.toString() : value;
      updateStmt.run(key, stringValue);
    }

    console.log('User settings updated successfully');
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

/**
 * Get a specific setting value
 */
export function getSetting(key: keyof UserSettings): string | boolean {
  try {
    const result = db
      .prepare('SELECT value FROM UserSettings WHERE key = ?')
      .get(key) as { value: string } | undefined;

    if (!result) {
      // Return default values for missing settings
      const defaults: UserSettings = {
        schedule_morning_enabled: true,
        schedule_morning_time: '08:00',
        schedule_evening_enabled: true,
        schedule_evening_time: '18:00',
        notifications_enabled: true,
      };
      return defaults[key];
    }

    // Convert boolean strings back to boolean
    if (key.includes('enabled')) {
      return result.value === 'true';
    }

    return result.value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    throw error;
  }
}

/**
 * Set a specific setting value
 */
export function setSetting(
  key: keyof UserSettings,
  value: string | boolean
): void {
  try {
    const stringValue = typeof value === 'boolean' ? value.toString() : value;

    db.prepare(
      `
      INSERT OR REPLACE INTO UserSettings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `
    ).run(key, stringValue);

    console.log(`Setting ${key} updated to ${stringValue}`);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}
