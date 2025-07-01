import { BrowserWindow } from 'electron';
import { join } from 'node:path';

import { createWindow } from 'lib/electron-app/factories/windows/create';
import { ENVIRONMENT } from 'shared/constants';
import { displayName } from '~/package.json';

export async function MainWindow() {
  const window = createWindow({
    id: 'main',
    title: displayName,
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    show: false,
    center: true,
    movable: true,
    resizable: true,
    alwaysOnTop: false,
    autoHideMenuBar: true,

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Add debug logging for preload script
  console.log(
    '🔧 Preload script path:',
    join(__dirname, '../preload/index.js')
  );

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: 'detach' });
    }

    window.show();
  });

  window.on('close', () => {
    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.destroy();
    }
  });

  return window;
}
