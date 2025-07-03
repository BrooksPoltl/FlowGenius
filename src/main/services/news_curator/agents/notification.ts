/**
 * NotificationAgent: Handles desktop notifications for completed briefings
 * Uses Electron's native Notification API to inform users when new briefings are ready
 */

import { Notification, BrowserWindow, nativeImage } from 'electron';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { DatabaseWriterAgent } from './database_writer';
import { getUserSettings } from '../../user-settings';
import { ENVIRONMENT } from '../../../../shared/constants';

/**
 * State interface for the notification agent
 */
export interface NotificationState {
  briefingId: number;
  briefingTitle: string;
  articleCount: number;
  summary?: {
    title: string;
    subtitle: string;
  };
}

/**
 * Notification agent that shows desktop notifications when briefings are complete
 */
export class NotificationAgent {
  /**
   * Get the notification icon path
   * Uses the same icon as the main app window
   */
  private static getNotificationIcon(): string | undefined {
    try {
      const iconPath = ENVIRONMENT.IS_DEV 
        ? join(process.cwd(), 'src/resources/public/image.jpg')
        : join(__dirname, '../../../resources/public/image.jpg');
      
      console.log('📱 NotificationAgent: Icon path:', iconPath);
      console.log('📱 NotificationAgent: Icon exists:', existsSync(iconPath));
      
      if (existsSync(iconPath)) {
        return iconPath;
      }
      
      console.warn('📱 NotificationAgent: Icon file not found, using default');
      return undefined;
    } catch (error) {
      console.error('📱 NotificationAgent: Error getting icon path:', error);
      return undefined;
    }
  }
  /**
   * Main agent function to send notification
   * Called by the LangGraph workflow after successful briefing creation
   */
  static async sendBriefingNotification(
    state: NotificationState
  ): Promise<NotificationState> {
    try {
      console.log(
        `📱 NotificationAgent: Processing notification for briefing ${state.briefingId}`
      );

      // Check if notifications are enabled
      const settings = getUserSettings();
      if (!settings.notifications_enabled) {
        console.log(
          '📱 NotificationAgent: Notifications are disabled, skipping'
        );
        return state;
      }

      // Get the briefing with summary data
      const briefing = DatabaseWriterAgent.getBriefingWithSummary(
        state.briefingId
      );
      if (!briefing) {
        console.error('📱 NotificationAgent: Briefing not found');
        return state;
      }

      // Parse summary if available
      let notificationTitle = 'Your briefing is ready';
      let notificationBody = `${state.articleCount} articles curated for you`;

      if (briefing.summary_json) {
        const summary = DatabaseWriterAgent.parseSummaryFromBriefing(briefing);
        if (summary) {
          notificationTitle = summary.title || notificationTitle;
          notificationBody = summary.subtitle || notificationBody;
        }
      }

      // Create and show notification
      const notification = new Notification({
        title: notificationTitle,
        body: notificationBody,
        icon: NotificationAgent.getNotificationIcon(),
        silent: false,
        urgency: 'normal',
      });

      // Handle notification click - bring app to foreground
      notification.on('click', () => {
        console.log('📱 NotificationAgent: Notification clicked, focusing app');
        NotificationAgent.focusMainWindow();
      });

      notification.show();

      console.log(
        `📱 NotificationAgent: Notification sent - "${notificationTitle}"`
      );

      return {
        ...state,
        summary: briefing.summary_json
          ? {
              title: notificationTitle,
              subtitle: notificationBody,
            }
          : undefined,
      };
    } catch (error) {
      console.error('📱 NotificationAgent: Error sending notification:', error);
      // Don't throw error - notification failure shouldn't break the workflow
      return state;
    }
  }

  /**
   * Bring the main application window to the foreground
   * Called when user clicks on notification
   */
  static focusMainWindow(): void {
    try {
      const mainWindow = BrowserWindow.getAllWindows().find(
        (win: BrowserWindow) => !win.isDestroyed()
      );

      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.show();
        console.log('📱 NotificationAgent: Main window focused');
      } else {
        console.warn('📱 NotificationAgent: No main window found to focus');
      }
    } catch (error) {
      console.error('📱 NotificationAgent: Error focusing main window:', error);
    }
  }

  /**
   * Test notification function for development/debugging
   */
  static async sendTestNotification(): Promise<void> {
    try {
      const notification = new Notification({
        title: 'PulseNews Test',
        body: 'This is a test notification from PulseNews',
        icon: NotificationAgent.getNotificationIcon(),
        silent: false,
      });

      notification.on('click', () => {
        console.log('📱 Test notification clicked');
        NotificationAgent.focusMainWindow();
      });

      notification.show();
      console.log('📱 NotificationAgent: Test notification sent');
    } catch (error) {
      console.error(
        '📱 NotificationAgent: Error sending test notification:',
        error
      );
    }
  }
}
