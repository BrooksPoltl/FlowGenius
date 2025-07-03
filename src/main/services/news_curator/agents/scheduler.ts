/**
 * InterestSchedulerAgent - Determines which interests to search based on cool-down logic
 * This agent implements smart cool-down to prevent over-searching topics that don't yield new content
 */

import { checkCooldownStatus } from '../../../db/migrations/001_add_interest_discovery_tracking';
import type { WorkflowState } from '../../../../shared/types';

/**
 * Schedules interests for search based on discovery patterns and cool-down logic
 * @param state - Current workflow state containing user interests
 * @returns Updated state with scheduled and cooled-down interests
 */
export async function interestSchedulerAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const userInterests = state.userInterests || [];
    if (userInterests.length === 0) {
      throw new Error('No user interests provided to scheduler');
    }

    if (state.force) {
      console.log('💨 Force option enabled, bypassing cooldown check.');
      return {
        ...state,
        scheduledInterests: userInterests,
        cooledDownInterests: [],
        schedulingComplete: true,
      };
    }

    console.log('📊 Checking cooldown status for interests...');

    const { scheduledInterests, cooledDownInterests } =
      await checkCooldownStatus(userInterests);

    console.log(`📅 Scheduling ${scheduledInterests.length} interests...`);
    console.log(`📅 Current time: ${new Date().toISOString()}`);

    return {
      ...state,
      scheduledInterests,
      cooledDownInterests,
      schedulingComplete: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('InterestSchedulerAgent error:', errorMessage);

    return {
      ...state,
      scheduledInterests: [],
      cooledDownInterests: [],
      schedulingComplete: false,
      error: errorMessage,
    };
  }
}
