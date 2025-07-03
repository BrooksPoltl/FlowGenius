/**
 * SettingsAgent - Retrieves user interests from the database
 * This is the first agent in the news curation workflow
 */

import { getUserInterests } from '../../settings';
import type { WorkflowState } from '../../../../shared/types';

/**
 * SettingsAgent function that retrieves user interests from the database
 * @param _state - Current state (can be empty for initial call)
 * @returns Updated state with user interests
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function settingsAgent(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const interests = getUserInterests();

    if (interests.length === 0) {
      throw new Error('No interests found. Please add some interests first.');
    }

    return {
      userInterests: interests,
      settingsLoaded: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('SettingsAgent error:', errorMessage);

    return {
      userInterests: [],
      settingsLoaded: false,
      error: errorMessage,
    };
  }
}

// Legacy interface for backwards compatibility
export interface SettingsState {
  interests: string[];
  error?: string;
}
