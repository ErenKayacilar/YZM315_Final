import { app, BrowserWindow, Tray, Menu, nativeImage, session, ipcMain } from 'electron';
import path from 'path';

// Initialize electron-dl for download management
const { download } = require('electron-dl');

// Determine if we're in development mode
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// App version
const appVersion = app.getVersion();

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'default',
        show: false,
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../out/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray(): void {
    // Create tray icon (use a placeholder - you can replace with actual icon)
    const iconPath = path.join(__dirname, '../public/tray-icon.png');

    // Create a simple 16x16 icon if file doesn't exist
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (trayIcon.isEmpty()) {
            // Create a simple colored square as fallback
            trayIcon = nativeImage.createEmpty();
        }
    } catch {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('LMS Platform');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Göster/Gizle',
            click: () => {
                if (mainWindow?.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow?.show();
                    mainWindow?.focus();
                }
            },
        },
        {
            type: 'separator',
        },
        {
            label: 'Çıkış',
            click: () => {
                app.isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    // Double-click to show window
    tray.on('double-click', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
}

function setupPermissions(): void {
    // Handle permission requests for webcam/microphone (Canlı Ders support)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'notifications', 'fullscreen'];

        if (allowedPermissions.includes(permission)) {
            callback(true);
        } else {
            console.log(`Permission request denied: ${permission}`);
            callback(false);
        }
    });

    // Handle permission check
    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'notifications', 'fullscreen'];
        return allowedPermissions.includes(permission);
    });
}

// IPC Handlers
function setupIpcHandlers(): void {
    ipcMain.handle('get-version', () => {
        return appVersion;
    });

    ipcMain.on('minimize-to-tray', () => {
        mainWindow?.hide();
    });

    ipcMain.handle('is-dev', () => {
        return isDev;
    });
}

// App lifecycle
app.whenReady().then(() => {
    setupPermissions();
    setupIpcHandlers();
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't quit on Windows/Linux - minimize to tray
        // app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

// Extend app type for isQuitting flag
declare global {
    namespace Electron {
        interface App {
            isQuitting: boolean;
        }
    }
}

app.isQuitting = false;
