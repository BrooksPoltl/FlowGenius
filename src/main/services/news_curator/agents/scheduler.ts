/**
 * InterestSchedulerAgent - Filters interests based on discovery cool-down periods
 * This agent prevents searching for topics that have recently provided new articles
 */

import db from '../../../db';
import { SettingsState } from './settings';

export interface SchedulerState extends SettingsState {
  scheduledInterests: string[];
  cooledDownInterests: string[];
  schedulingComplete: boolean;
}

/**
 * InterestSchedulerAgent function that filters interests based on cool-down logic
 * @param state - State containing user interests from SettingsAgent
 * @returns Updated state with scheduled (active) interests only
 */
export async function interestSchedulerAgent(state: any): Promise<any> {
  try {
    const { userInterests, error } = state;

    // If there was an error in previous agent, pass it through
    if (error) {
      return {
        scheduledInterests: [],
        cooledDownInterests: [],
        schedulingComplete: true,
        error,
      };
    }

    if (!userInterests || userInterests.length === 0) {
      console.log('No interests to schedule');
      return {
        scheduledInterests: [],
        cooledDownInterests: [],
        schedulingComplete: true,
      };
    }

    console.log(`📅 Scheduling ${userInterests.length} interests...`);

    const scheduledInterests: string[] = [];
    const cooledDownInterests: string[] = [];

    // Get interest discovery data from database
    const getInterestData = db.prepare(`
      SELECT 
        name,
        last_new_article_at,
        discovery_count,
        avg_discovery_interval_seconds
      FROM Interests 
      WHERE name IN (${userInterests.map(() => '?').join(',')})
    `);

    const interestData = getInterestData.all(...userInterests) as Array<{
      name: string;
      last_new_article_at: string | null;
      discovery_count: number;
      avg_discovery_interval_seconds: number;
    }>;

    const currentTime = new Date();

    for (const interest of userInterests) {
      const data = interestData.find(d => d.name === interest);

      if (!data) {
        // Interest not found in database (shouldn't happen), schedule it
        console.log(
          `⚠️  Interest "${interest}" not found in database, scheduling anyway`
        );
        scheduledInterests.push(interest);
        continue;
      }

      // If no discovery history, schedule it (first time or no articles found yet)
      if (
        !data.last_new_article_at ||
        data.discovery_count === 0 ||
        data.avg_discovery_interval_seconds === 0
      ) {
        console.log(
          `🆕 Interest "${interest}" has no discovery history, scheduling`
        );
        scheduledInterests.push(interest);
        continue;
      }

      // Calculate time since last discovery
      const lastDiscovery = new Date(data.last_new_article_at);
      const timeSinceLastDiscovery =
        (currentTime.getTime() - lastDiscovery.getTime()) / 1000; // in seconds

      // Calculate cool-down threshold (3x average discovery interval)
      const coolDownThreshold = data.avg_discovery_interval_seconds * 3;

      if (timeSinceLastDiscovery >= coolDownThreshold) {
        console.log(
          `✅ Interest "${interest}" ready for search (${Math.round(timeSinceLastDiscovery / 3600)}h since last vs ${Math.round(coolDownThreshold / 3600)}h threshold)`
        );
        scheduledInterests.push(interest);
      } else {
        const remainingCoolDown = coolDownThreshold - timeSinceLastDiscovery;
        console.log(
          `❄️  Interest "${interest}" on cool-down (${Math.round(remainingCoolDown / 3600)}h remaining)`
        );
        cooledDownInterests.push(interest);
      }
    }

    console.log(
      `📅 Scheduling complete: ${scheduledInterests.length} active, ${cooledDownInterests.length} on cool-down`
    );

    return {
      scheduledInterests,
      cooledDownInterests,
      schedulingComplete: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in InterestSchedulerAgent';
    console.error('InterestSchedulerAgent error:', errorMessage);

    return {
      scheduledInterests: [],
      cooledDownInterests: [],
      schedulingComplete: false,
      error: errorMessage,
    };
  }
}
