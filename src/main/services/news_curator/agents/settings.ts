/**
 * SettingsAgent - Retrieves user interests from the database
 * This is the first agent in the news curation workflow
 */

import { getUserInterests } from '../../settings';

export interface SettingsState {
  interests: string[];
  error?: string;
}

/**
 * SettingsAgent function that retrieves user interests from the database
 * @param state - Current state (can be empty for initial call)
 * @returns Updated state with user interests
 */
export async function settingsAgent(
  state: Partial<SettingsState> = {}
): Promise<SettingsState> {
  try {
    const interests = getUserInterests();

    if (interests.length === 0) {
      throw new Error('No interests found. Please add some interests first.');
    }

    return {
      ...state,
      interests,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('SettingsAgent error:', errorMessage);

    return {
      ...state,
      interests: [],
      error: errorMessage,
    };
  }
}
