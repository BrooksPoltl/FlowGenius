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
  private static hasRequestedPermission = false;

  /**
   * Request notification permissions on macOS
   * This triggers the system permission dialog
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      console.log('📱 NotificationAgent: Permission request not needed on non-macOS platforms');
      return true;
    }

    if (NotificationAgent.hasRequestedPermission) {
      console.log('📱 NotificationAgent: Permission already requested');
      return true;
    }

    try {
      console.log('📱 NotificationAgent: Requesting notification permission on macOS...');
      
      // Create a permission request notification
      const permissionNotification = new Notification({
        title: 'PulseNews',
        body: 'Click "Allow" to receive briefing notifications',
        silent: true,
      });

      return new Promise((resolve) => {
        permissionNotification.on('show', () => {
          console.log('📱 NotificationAgent: Permission notification shown - user likely granted permission');
          NotificationAgent.hasRequestedPermission = true;
          resolve(true);
        });

        permissionNotification.on('failed', (error) => {
          console.log('📱 NotificationAgent: Permission notification failed - user likely denied permission:', error);
          NotificationAgent.hasRequestedPermission = true;
          resolve(false);
        });

        // Set a timeout in case no events fire
        setTimeout(() => {
          console.log('📱 NotificationAgent: Permission request timed out');
          NotificationAgent.hasRequestedPermission = true;
          resolve(false);
        }, 5000);

        permissionNotification.show();
        console.log('📱 NotificationAgent: Permission notification sent');
      });
    } catch (error) {
      console.error('📱 NotificationAgent: Error requesting notification permission:', error);
      NotificationAgent.hasRequestedPermission = true;
      return false;
    }
  }

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

      // Check if notifications are enabled in settings
      const settings = getUserSettings();
      console.log(`📱 NotificationAgent: Settings loaded:`, settings);
      
      if (!settings.notifications_enabled) {
        console.log(
          '📱 NotificationAgent: Notifications are disabled in user settings, skipping'
        );
        return state;
      }

      // Request notification permission if needed (macOS)
      if (process.platform === 'darwin') {
        console.log('📱 NotificationAgent: Requesting notification permission...');
        const hasPermission = await NotificationAgent.requestNotificationPermission();
        
        if (!hasPermission) {
          console.log('📱 NotificationAgent: Notification permission denied or failed');
          return state;
        }
        
        console.log('📱 NotificationAgent: Notification permission granted');
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
      console.log(`📱 NotificationAgent: Creating notification with title: "${notificationTitle}"`);
      console.log(`📱 NotificationAgent: Creating notification with body: "${notificationBody}"`);
      
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

      // Add error handling for notification display
      notification.on('show', () => {
        console.log('📱 NotificationAgent: Notification displayed successfully');
      });

      notification.on('failed', (error) => {
        console.error('📱 NotificationAgent: Notification failed to display:', error);
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
      console.log('📱 NotificationAgent: Starting test notification...');
      
      // Check system support first
      const supported = Notification.isSupported();
      console.log('📱 NotificationAgent: System notification support:', supported);
      
      if (!supported) {
        throw new Error('Notifications are not supported on this system');
      }

      // Check user settings
      const settings = getUserSettings();
      console.log('📱 NotificationAgent: User settings:', settings);
      
      if (!settings.notifications_enabled) {
        throw new Error('Notifications are disabled in user settings');
      }

      // Request notification permission if needed (macOS)
      if (process.platform === 'darwin') {
        console.log('📱 NotificationAgent: Requesting notification permission for test...');
        const hasPermission = await NotificationAgent.requestNotificationPermission();
        
        if (!hasPermission) {
          throw new Error('Notification permission denied or failed');
        }
        
        console.log('📱 NotificationAgent: Test notification permission granted');
      }

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

      notification.on('show', () => {
        console.log('📱 NotificationAgent: Test notification displayed successfully');
      });

      notification.on('failed', (error) => {
        console.error('📱 NotificationAgent: Test notification failed to display:', error);
      });

      notification.show();
      console.log('📱 NotificationAgent: Test notification sent');
    } catch (error) {
      console.error(
        '📱 NotificationAgent: Error sending test notification:',
        error
      );
      throw error; // Re-throw so the renderer can show the error
    }
  }
}
