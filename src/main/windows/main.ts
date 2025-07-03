import { BrowserWindow, nativeImage, app } from 'electron';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

import { createWindow } from 'lib/electron-app/factories/windows/create';
import { ENVIRONMENT } from 'shared/constants';
import { displayName } from '~/package.json';

export async function MainWindow() {
  // Set up icon path with debugging
  const iconPath = ENVIRONMENT.IS_DEV 
    ? join(process.cwd(), 'src/resources/public/image.jpg')
    : join(__dirname, '../resources/public/image.jpg');
  
  console.log('🖼️ App icon path:', iconPath);
  console.log('🖼️ Icon file exists:', existsSync(iconPath));
  
  // Try to create the icon using nativeImage for better control
  let appIcon;
  try {
    if (existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath);
      console.log('🖼️ Icon created successfully, size:', appIcon.getSize());
      
      // Set app icon at the app level (for dock/taskbar)
      app.dock?.setIcon(appIcon);
      console.log('🖼️ App dock icon set successfully');
    } else {
      console.error('🖼️ Icon file not found at:', iconPath);
      appIcon = iconPath; // fallback to string path
    }
  } catch (error) {
    console.error('🖼️ Error creating icon:', error);
    appIcon = iconPath; // fallback to string path
  }
  
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
    icon: appIcon,

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
