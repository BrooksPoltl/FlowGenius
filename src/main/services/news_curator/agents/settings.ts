/**
 * SettingsAgent - Retrieves user interests from the database
 * This is the first agent in the news curation workflow
 */

import { getUserInterests } from '../../settings';
import { getInterestsForCategory } from '../../categories';
import type { WorkflowState } from '../../../../shared/types';

/**
 * SettingsAgent function that retrieves user interests from the database
 * @param state - Current state, may contain a categoryId to filter interests
 * @returns Updated state with user interests
 */

export async function settingsAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    let interests: string[] = [];
    const { categoryId } = state;

    if (categoryId) {
      console.log(`🔍 [AGENT] Loading interests for category: ${categoryId}`);
      interests = getInterestsForCategory(categoryId);
    } else {
      console.log('🔍 [AGENT] Loading all user interests for General briefing');
      interests = getUserInterests();
    }

    if (interests.length === 0) {
      const errorMessage = categoryId
        ? `No interests found for category ${categoryId}. Please add some interests to this category.`
        : 'No interests found. Please add some interests first.';
      throw new Error(errorMessage);
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
