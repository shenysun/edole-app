import { app, BrowserWindow, nativeTheme, screen } from 'electron';
import path from 'path';
import os from 'os';
import ShellAction from './actions/ShellAction';
import GitAction from './actions/GitAction';
import ScriptAction from './actions/ScriptAction';
import fixPath from 'fix-path';
import { AppMenu } from './menu/AppMenu';
import UpdaterAction from './actions/UpdaterAction';
import { mainSendToRender } from './common';
const checked = require('electron-squirrel-startup');

function init() {
    if (checked) {
        return;
    }
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
        const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
        let bounds = {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        };
        const standard = {
            w: 1023,
            h: 649,
        };
        if (display) {
            const w = standard.w;
            const h = standard.h;
            const x = Math.round(display.bounds.x + (display.workAreaSize.width - w) / 2);
            const y = Math.round(display.bounds.y + (display.workAreaSize.height - h) / 2);
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
        new ScriptAction(mainWindow);
        new GitAction(mainWindow);
        new UpdaterAction(mainWindow);

        mainWindow.loadURL(process.env.APP_URL);
        mainWindow.on('focus', () => {
            mainSendToRender(mainWindow, 'focus');
        });

        if (process.env.DEBUGGING) {
            // if on DEV or Production with debug enabled
            // mainWindow.webContents.openDevTools();
        } else {
            // we're on production; no access to devtools pls
            // mainWindow.webContents.on('devtools-opened', () => {
            //     mainWindow?.webContents.closeDevTools();
            // });
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
}

init();
