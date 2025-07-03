import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';

import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from 'electron-extension-installer';

import { PLATFORM, ENVIRONMENT } from 'shared/constants';
import { makeAppId } from 'shared/utils';
import { ignoreConsoleWarnings } from '../../utils/ignore-console-warnings';

ignoreConsoleWarnings(['Manifest version 2 is deprecated']);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Create system tray icon and menu
 */
function createSystemTray() {
  // Create a simple tray icon (you can replace with actual icon file)
  const trayIcon = nativeImage.createEmpty();
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show PulseNews',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('PulseNews - AI News Curator');
  tray.setContextMenu(contextMenu);

  // Show window when tray icon is clicked
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

export async function makeAppSetup(createWindow: () => Promise<BrowserWindow>) {
  if (ENVIRONMENT.IS_DEV) {
    await installExtension([REACT_DEVELOPER_TOOLS], {
      loadExtensionOptions: {
        allowFileAccess: true,
      },
    });
  }

  let window = await createWindow();
  mainWindow = window;

  // Create system tray
  createSystemTray();

  // Handle window close event - minimize to tray instead of quitting
  window.on('close', event => {
    if (!(app as any).isQuitting && !window.isDestroyed()) {
      event.preventDefault();
      window.hide();

      // Show notification on first minimize (only on Windows where displayBalloon exists)
      if (
        tray &&
        !window.isDestroyed() &&
        !window.isMinimized() &&
        process.platform === 'win32'
      ) {
        tray.displayBalloon({
          title: 'PulseNews',
          content:
            'PulseNews is running in the background. Click the tray icon to open.',
        });
      }
    }
  });

  // Clean up mainWindow reference when window is destroyed
  window.on('closed', () => {
    if (window === mainWindow) {
      mainWindow = null;
    }
  });

  app.on('activate', async () => {
    const windows = BrowserWindow.getAllWindows();

    if (!windows.length) {
      window = await createWindow();
      mainWindow = window;
    } else {
      for (window of windows.reverse()) {
        if (!window.isDestroyed()) {
          window.show();
          window.restore();
        }
      }
    }
  });

  app.on('web-contents-created', (_, contents) =>
    contents.on(
      'will-navigate',
      (event, _) => !ENVIRONMENT.IS_DEV && event.preventDefault()
    )
  );

  // Modified: Don't quit when all windows are closed, keep running in background
  app.on('window-all-closed', () => {
    // On macOS, keep the app running even when all windows are closed
    if (PLATFORM.IS_MAC) {
      // Keep app running in dock
      console.log('macOS: Keeping app running in dock');
    }
    // On other platforms, keep running in system tray
  });

  // Handle app quit properly
  app.on('before-quit', () => {
    (app as any).isQuitting = true;
  });

  return window;
}

PLATFORM.IS_LINUX && app.disableHardwareAcceleration();

PLATFORM.IS_WINDOWS &&
  app.setAppUserModelId(ENVIRONMENT.IS_DEV ? process.execPath : makeAppId());

app.commandLine.appendSwitch('force-color-profile', 'srgb');
