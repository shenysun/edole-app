import { app, BrowserWindow, nativeTheme, screen } from 'electron';
import path from 'path';
import os from 'os';
import ShellAction from './actions/ShellAction';
import fixPath from 'fix-path';
import { AppMenu } from './menu/AppMenu';

fixPath();
// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
    if (platform === 'win32' && nativeTheme.shouldUseDarkColors) {
        require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'));
    }
} catch (_) {}

let mainWindow: BrowserWindow | undefined;

function initApp() {
    createWindow();
    new AppMenu(platform);
}

function createWindow() {
    /**
     * Initial window options
     */
    const displays = screen.getAllDisplays();
    const display =
        displays.find((display) => {
            return display.bounds.x !== 0 || display.bounds.y !== 0;
        }) || screen.getPrimaryDisplay();

    let bounds = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };
    const scale = 3 / 5;
    if (display) {
        const w = Math.round(display.workAreaSize.width * scale);
        const h = Math.round(display.workAreaSize.height * scale);
        const x = Math.round(display.bounds.x + (display.workAreaSize.width - display.workAreaSize.width * scale) / 2);
        const y = Math.round(
            display.bounds.y + (display.workAreaSize.height - display.workAreaSize.height * scale) / 2
        );
        bounds = {
            x,
            y,
            w,
            h,
        };
    }

    mainWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
        width: bounds.w,
        height: bounds.h,
        useContentSize: true,
        webPreferences: {
            contextIsolation: true,
            // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
            preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
        },
    });

    new ShellAction(mainWindow);

    mainWindow.loadURL(process.env.APP_URL);

    if (process.env.DEBUGGING) {
        // if on DEV or Production with debug enabled
        mainWindow.webContents.openDevTools();
    } else {
        // we're on production; no access to devtools pls
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow?.webContents.closeDevTools();
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = undefined;
    });
}

app.whenReady().then(initApp);

app.on('window-all-closed', () => {
    if (platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === undefined) {
        initApp();
    }
});
