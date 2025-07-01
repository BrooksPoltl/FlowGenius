/**
 * SettingsAgent - Retrieves user interests from the database
 * This is the first agent in the news curation workflow
 */

import { getUserInterests } from '../../settings';

/**
 * SettingsAgent function that retrieves user interests from the database
 * @param _state - Current state (can be empty for initial call)
 * @returns Updated state with user interests
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function settingsAgent(_state: any): Promise<any> {
  try {
    const interests = getUserInterests();

    if (interests.length === 0) {
      throw new Error('No interests found. Please add some interests first.');
    }

    return {
      interests,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('SettingsAgent error:', errorMessage);

    return {
      interests: [],
      error: errorMessage,
    };
  }
}

// Legacy interface for backwards compatibility
export interface SettingsState {
  interests: string[];
  error?: string;
}
