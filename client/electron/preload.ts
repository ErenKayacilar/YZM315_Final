import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process via context bridge
contextBridge.exposeInMainWorld('electronAPI', {
    // Get app version
    getVersion: (): Promise<string> => ipcRenderer.invoke('get-version'),

    // Minimize window to system tray
    minimizeToTray: (): void => ipcRenderer.send('minimize-to-tray'),

    // Check if running in development mode
    isDev: (): Promise<boolean> => ipcRenderer.invoke('is-dev'),

    // Platform detection
    platform: process.platform,

    // Check if running in Electron
    isElectron: true,
});

// Type declaration for TypeScript
declare global {
    interface Window {
        electronAPI: {
            getVersion: () => Promise<string>;
            minimizeToTray: () => void;
            isDev: () => Promise<boolean>;
            platform: string;
            isElectron: boolean;
        };
    }
}
