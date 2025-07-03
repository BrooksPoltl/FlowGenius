/**
 * Scheduler Service
 * Manages automatic execution of news curation workflow based on user-defined schedules
 */

import * as cron from 'node-cron';
import { getUserSettings } from './user-settings';
import { executeNewsCurationWorkflow } from './news_curator/graph';
import { getEnabledCategorySchedules } from './categories';
import type { CategoryWithSchedule, WorkflowState } from '../../shared/types';

/**
 * Interface for active scheduled jobs
 */
interface ScheduledJob {
  id: string;
  cronExpression: string;
  task: cron.ScheduledTask;
  description: string;
}

/**
 * Scheduler class to manage automatic news curation
 */
export class SchedulerService {
  private static instance: SchedulerService;

  private activeJobs: Map<string, ScheduledJob> = new Map();

  private constructor() {
    // Initialize scheduler service
    console.log('⏰ Scheduler service instantiated');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Initialize scheduler with current user settings
   */
  initialize(): void {
    console.log('⏰ Initializing scheduler service...');
    this.updateSchedules();
    console.log('⏰ Scheduler service initialized');
  }

  /**
   * Update schedules based on current user settings and category schedules
   * Call this whenever user settings or category schedules change
   */
  updateSchedules(): void {
    console.log(
      '⏰ Updating schedules based on user settings and category schedules...'
    );

    // Clear existing jobs
    this.clearAllJobs();

    // Get current global settings
    const settings = getUserSettings();

    // Schedule global morning briefing if enabled
    if (settings.schedule_morning_enabled) {
      this.scheduleMorningBriefing(settings.schedule_morning_time);
    }

    // Schedule global evening briefing if enabled
    if (settings.schedule_evening_enabled) {
      this.scheduleEveningBriefing(settings.schedule_evening_time);
    }

    // Schedule category-specific briefings
    const categorySchedules = getEnabledCategorySchedules();
    for (const categorySchedule of categorySchedules) {
      this.scheduleCategoryBriefing(categorySchedule);
    }

    console.log(`⏰ Active schedules: ${this.activeJobs.size} jobs`);
    this.logActiveJobs();
  }

  /**
   * Schedule morning briefing
   */
  private scheduleMorningBriefing(time: string): void {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const cronExpression = `${minutes} ${hours} * * *`; // Daily at specified time

      const task = cron.schedule(
        cronExpression,
        async () => {
          console.log('🌅 Executing scheduled morning briefing...');
          await SchedulerService.executeBriefingWorkflow('morning');
        },
        {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      );

      const job: ScheduledJob = {
        id: 'morning',
        cronExpression,
        task,
        description: `Morning briefing at ${time}`,
      };

      this.activeJobs.set('morning', job);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(
        `⏰ Scheduled morning briefing at ${time} (${cronExpression}) in timezone ${timezone}`
      );
    } catch (error) {
      console.error('⏰ Error scheduling morning briefing:', error);
    }
  }

  /**
   * Schedule evening briefing
   */
  private scheduleEveningBriefing(time: string): void {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const cronExpression = `${minutes} ${hours} * * *`; // Daily at specified time

      const task = cron.schedule(
        cronExpression,
        async () => {
          console.log('🌆 Executing scheduled evening briefing...');
          await SchedulerService.executeBriefingWorkflow('evening');
        },
        {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      );

      const job: ScheduledJob = {
        id: 'evening',
        cronExpression,
        task,
        description: `Evening briefing at ${time}`,
      };

      this.activeJobs.set('evening', job);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(
        `⏰ Scheduled evening briefing at ${time} (${cronExpression}) in timezone ${timezone}`
      );
    } catch (error) {
      console.error('⏰ Error scheduling evening briefing:', error);
    }
  }

  /**
   * Schedule category-specific briefing
   */
  private scheduleCategoryBriefing(
    categorySchedule: CategoryWithSchedule
  ): void {
    try {
      const task = cron.schedule(
        categorySchedule.cron_expression,
        async () => {
          console.log(
            `📂 Executing scheduled briefing for category "${categorySchedule.categoryName}"...`
          );
          await SchedulerService.executeBriefingWorkflow(
            'category',
            categorySchedule.category_id
          );
        },
        {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      );

      const job: ScheduledJob = {
        id: `category-${categorySchedule.category_id}`,
        cronExpression: categorySchedule.cron_expression,
        task,
        description: `${categorySchedule.categoryName} briefing (${categorySchedule.cron_expression})`,
      };

      this.activeJobs.set(job.id, job);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(
        `⏰ Scheduled category briefing for "${categorySchedule.categoryName}" (${categorySchedule.cron_expression}) in timezone ${timezone}`
      );
    } catch (error) {
      console.error(
        `⏰ Error scheduling category briefing for "${categorySchedule.categoryName}":`,
        error
      );
    }
  }

  /**
   * Execute the briefing workflow
   */
  private static async executeBriefingWorkflow(
    type: 'morning' | 'evening' | 'category',
    categoryId?: number
  ): Promise<void> {
    try {
      console.log(`⏰ Starting ${type} briefing workflow...`);
      const startTime = Date.now();

      const result = await executeNewsCurationWorkflow(categoryId);

      const duration = Date.now() - startTime;
      console.log(`⏰ ${type} briefing completed in ${duration}ms`);
      console.log(
        `⏰ Results: ${result.curatedArticles.length} articles curated, ${result.newArticlesSaved} new articles saved`
      );

      // If articles were found, create a briefing and start summary generation
      if (result.curatedArticles.length > 0) {
        await SchedulerService.createBriefingAndStartSummary(result, type);
      } else {
        console.log(`⏰ No new articles found for ${type} briefing`);
      }
    } catch (error) {
      console.error(`⏰ Error executing ${type} briefing:`, error);
    }
  }

  /**
   * Create briefing and start background summary generation
   */
  private static async createBriefingAndStartSummary(
    result: Partial<WorkflowState>,
    type: string
  ): Promise<void> {
    try {
      // Import database and other dependencies
      const db = await import('../db').then(m => m.default);
      const { getUserInterests } = await import('./settings');
      const { generateSummaryInBackground } = await import(
        './news_curator/graph'
      );

      const curatedArticles = result.curatedArticles || [];

      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const briefingTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${dateStr}`;

      const topics = getUserInterests();

      const insertBriefing = db.prepare(
        'INSERT INTO Briefings (title, topics_json, articles_json) VALUES (?, ?, ?)'
      );
      const briefingResult = insertBriefing.run(
        briefingTitle,
        JSON.stringify(topics),
        JSON.stringify(curatedArticles)
      );
      const briefingId = Number(briefingResult.lastInsertRowid);

      const insertBriefingArticle = db.prepare(
        'INSERT INTO Briefing_Articles (briefing_id, article_id) VALUES (?, ?)'
      );

      const getArticleId = db.prepare('SELECT id FROM Articles WHERE url = ?');

      for (const article of curatedArticles) {
        const articleRow = getArticleId.get(article.url) as
          | { id: number }
          | undefined;
        if (articleRow) {
          insertBriefingArticle.run(briefingId, articleRow.id);
        }
      }

      console.log(
        `⏰ Created briefing "${briefingTitle}" with ${curatedArticles.length} articles (${result.newArticlesSaved || 0} new, ${result.duplicatesFiltered || 0} duplicates filtered).`
      );

      // Notify renderer that a new briefing was created
      const { notifyRendererBriefingCreated } = await import('../index');
      notifyRendererBriefingCreated(briefingId);

      // Start background summary generation for the briefing
      generateSummaryInBackground(
        briefingId,
        curatedArticles,
        topics,
        false
      ).catch((error: unknown) => {
        console.error('⏰ Background summary generation failed:', error);
      });
    } catch (error) {
      console.error('⏰ Error creating briefing:', error);
    }
  }

  /**
   * Clear all scheduled jobs
   */
  private clearAllJobs(): void {
    console.log(`⏰ Clearing ${this.activeJobs.size} existing jobs...`);

    for (const [id, job] of this.activeJobs) {
      try {
        job.task.stop();
        job.task.destroy();
        console.log(`⏰ Stopped job: ${id}`);
      } catch (error) {
        console.error(`⏰ Error stopping job ${id}:`, error);
      }
    }

    this.activeJobs.clear();
  }

  /**
   * Log information about active jobs
   */
  private logActiveJobs(): void {
    if (this.activeJobs.size === 0) {
      console.log('⏰ No active scheduled jobs');
      return;
    }

    console.log('⏰ Active scheduled jobs:');
    for (const [id, job] of this.activeJobs) {
      console.log(`  - ${id}: ${job.description} (${job.cronExpression})`);
    }
  }

  /**
   * Get status of all active jobs
   */
  getJobsStatus(): Array<{
    id: string;
    description: string;
    cronExpression: string;
    isRunning: boolean;
  }> {
    const status = [];

    for (const [id, job] of this.activeJobs) {
      status.push({
        id,
        description: job.description,
        cronExpression: job.cronExpression,
        isRunning: job.task.getStatus() === 'scheduled',
      });
    }

    return status;
  }

  /**
   * Stop all scheduled jobs (for app shutdown)
   */
  shutdown(): void {
    console.log('⏰ Shutting down scheduler service...');
    this.clearAllJobs();
    console.log('⏰ Scheduler service shut down');
  }

  /**
   * Manually trigger a briefing (for testing)
   */
  static async triggerManualBriefing(): Promise<void> {
    console.log('⏰ Manually triggering briefing workflow...');
    await SchedulerService.executeBriefingWorkflow('manual' as any);
  }
}
