/**
 * Notification utilities for the main process
 * Handles communication between workflow and renderer
 */

import { BrowserWindow } from 'electron';

/**
 * Notify renderer when a new briefing is created
 * Sends a message to the renderer process to update the UI
 */
export function notifyRendererBriefingCreated(briefingId: number): void {
  const mainWindow = BrowserWindow.getAllWindows().find(
    (win: BrowserWindow) => !win.isDestroyed()
  );
  if (mainWindow) {
    mainWindow.webContents.send('briefing-created', briefingId);
  }
  console.log(`📢 Notified renderer that briefing ${briefingId} was created`);
}

/**
 * Notify renderer when a summary is ready
 * Sends a message to the renderer process to update the UI
 */
export function notifyRendererSummaryReady(briefingId: number): void {
  const mainWindow = BrowserWindow.getAllWindows().find(
    (win: BrowserWindow) => !win.isDestroyed()
  );
  if (mainWindow) {
    mainWindow.webContents.send('summary-ready', briefingId);
  }
  console.log(
    `📢 Notified renderer that summary for briefing ${briefingId} is ready`
  );
}
