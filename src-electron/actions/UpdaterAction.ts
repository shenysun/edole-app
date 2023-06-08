import { app, autoUpdater, BrowserWindow, dialog, ipcMain } from 'electron';
import { UpdaterEvent } from '../events/ShellEvent';

export default class UpdaterAction {
    constructor(private mainWindow: BrowserWindow) {
        this.init();
    }

    private init() {
        const server = 'https://edole-app-updater.vercel.app';
        const url = `${server}/update/${process.platform}/${app.getVersion()}`;
        autoUpdater.setFeedURL({ url });
        this.registerHandler();
        if (process.env.NODE_ENV === 'production') {
            setTimeout(() => {
                autoUpdater.checkForUpdates();
            }, 1000);
        }
    }

    private registerHandler() {
        ipcMain.handle(UpdaterEvent.quitAndInstall, () => {
            autoUpdater.quitAndInstall();
        });

        autoUpdater.on('checking-for-update', () => {
            this.mainWindow.webContents.send('log', '[updater] 开始检测更新');
        });

        autoUpdater.on('update-available', () => {
            this.mainWindow.webContents.send('log', '[updater] 有更新可以使用');
        });

        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
            this.mainWindow?.webContents.send('log', '[updater] 更新下载完成:', event, releaseNotes, releaseName);
            this.mainWindow?.webContents.send(UpdaterEvent.downloaded, releaseNotes, releaseName);
        });

        autoUpdater.on('error', (error) => {
            this.mainWindow?.webContents.send('log', '[updater] 更新失败:', error);
        });
    }
}
