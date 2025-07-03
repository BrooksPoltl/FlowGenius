/**
 * Migration 001: Add Interest Discovery Tracking Columns
 * Adds columns to track discovery intervals for smart cool-down feature
 */

import db from '../index';

export function runMigration001(): void {
  try {
    console.log(
      'Running migration 001: Add interest discovery tracking columns...'
    );

    // Check if migration is needed by checking if columns exist
    const tableInfo = db
      .prepare('PRAGMA table_info(Interests)')
      .all() as Array<{
      name: string;
      type: string;
    }>;

    const hasLastNewArticleAt = tableInfo.some(
      col => col.name === 'last_new_article_at'
    );
    const hasDiscoveryCount = tableInfo.some(
      col => col.name === 'discovery_count'
    );
    const hasAvgDiscoveryInterval = tableInfo.some(
      col => col.name === 'avg_discovery_interval_seconds'
    );

    if (hasLastNewArticleAt && hasDiscoveryCount && hasAvgDiscoveryInterval) {
      console.log('Migration 001: Columns already exist, skipping...');
      return;
    }

    // Add new columns to Interests table
    if (!hasLastNewArticleAt) {
      db.prepare(
        'ALTER TABLE Interests ADD COLUMN last_new_article_at TIMESTAMP'
      ).run();
      console.log('Added last_new_article_at column');
    }

    if (!hasDiscoveryCount) {
      db.prepare(
        'ALTER TABLE Interests ADD COLUMN discovery_count INTEGER DEFAULT 0'
      ).run();
      console.log('Added discovery_count column');
    }

    if (!hasAvgDiscoveryInterval) {
      db.prepare(
        'ALTER TABLE Interests ADD COLUMN avg_discovery_interval_seconds REAL DEFAULT 0.0'
      ).run();
      console.log('Added avg_discovery_interval_seconds column');
    }

    console.log('Migration 001 completed successfully');
  } catch (error) {
    console.error('Error running migration 001:', error);
    throw error;
  }
}

/**
 * Check cooldown status for interests and return scheduled vs cooled-down interests
 * @param userInterests - Array of interest names to check
 * @returns Object with scheduledInterests and cooledDownInterests arrays
 */
export function checkCooldownStatus(userInterests: string[]): {
  scheduledInterests: string[];
  cooledDownInterests: string[];
} {
  const scheduledInterests: string[] = [];
  const cooledDownInterests: string[] = [];

  // Get interest discovery data from database
  const getInterestData = db.prepare(`
    SELECT 
      name,
      last_new_article_at,
      discovery_count,
      avg_discovery_interval_seconds,
      last_search_attempt_at
    FROM Interests 
    WHERE name IN (${userInterests.map(() => '?').join(',')})
  `);

  const interestData = getInterestData.all(...userInterests) as Array<{
    name: string;
    last_new_article_at: string | null;
    discovery_count: number;
    avg_discovery_interval_seconds: number;
    last_search_attempt_at: string | null;
  }>;

  const currentTime = new Date();

  console.log(`📊 Discovery data for all interests:`);
  interestData.forEach(data => {
    console.log(
      `  - ${data.name}: last=${data.last_new_article_at}, count=${data.discovery_count}, avg=${Math.round(data.avg_discovery_interval_seconds / 3600)}h`
    );
  });

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

    // If no search history, schedule it (first time)
    if (!data.last_search_attempt_at) {
      console.log(
        `🆕 Interest "${interest}" has never been searched, scheduling`
      );
      scheduledInterests.push(interest);
      continue;
    }

    // Use search attempt time for cool-down, but fall back to discovery time if needed
    const lastSearchTime =
      data.last_search_attempt_at || data.last_new_article_at;

    if (!lastSearchTime) {
      console.log(
        `🆕 Interest "${interest}" has no search history, scheduling`
      );
      scheduledInterests.push(interest);
      continue;
    }

    // Calculate time since last search attempt
    const lastSearch = new Date(lastSearchTime);
    const timeSinceLastSearch =
      (currentTime.getTime() - lastSearch.getTime()) / 1000; // in seconds

    // Calculate cool-down threshold
    // If we have discovery data, use 3x average discovery interval, otherwise use 2 hours default
    const coolDownThreshold =
      data.avg_discovery_interval_seconds > 0
        ? data.avg_discovery_interval_seconds * 3
        : 2 * 3600; // 2 hours default

    console.log(`🔍 Analyzing "${interest}":`);
    console.log(`  📅 Last search attempt: ${lastSearchTime}`);
    console.log(
      `  ⏱️  Time since last search: ${Math.round(timeSinceLastSearch / 3600)}h (${Math.round(timeSinceLastSearch)} seconds)`
    );
    console.log(
      `  📊 Average discovery interval: ${Math.round(data.avg_discovery_interval_seconds / 3600)}h (${data.avg_discovery_interval_seconds} seconds)`
    );
    console.log(
      `  🚫 Cool-down threshold: ${Math.round(coolDownThreshold / 3600)}h (${coolDownThreshold} seconds)`
    );
    console.log(
      `  🧮 Calculation: ${Math.round(timeSinceLastSearch)} >= ${coolDownThreshold} ? ${timeSinceLastSearch >= coolDownThreshold}`
    );

    if (timeSinceLastSearch >= coolDownThreshold) {
      console.log(`  ✅ RESULT: Ready for search!`);
      scheduledInterests.push(interest);
    } else {
      const remainingCoolDown = coolDownThreshold - timeSinceLastSearch;
      console.log(
        `  ❄️  RESULT: On cool-down, ${Math.round(remainingCoolDown / 3600)}h remaining`
      );
      cooledDownInterests.push(interest);
    }
    console.log(``);
  }

  console.log(`📅 Scheduling complete:`);
  console.log(
    `  ✅ ${scheduledInterests.length} interests scheduled for search: ${scheduledInterests.join(', ')}`
  );
  console.log(
    `  ❄️  ${cooledDownInterests.length} interests on cool-down: ${cooledDownInterests.join(', ')}`
  );

  if (cooledDownInterests.length > 0) {
    console.log(
      `  💡 Cool-down interests will be reconsidered when their 3x average interval expires`
    );
  }

  return {
    scheduledInterests,
    cooledDownInterests,
  };
}
