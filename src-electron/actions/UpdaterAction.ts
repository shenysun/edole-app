import { app, autoUpdater, BrowserWindow, ipcMain } from 'electron';
import { mainSendToRender } from '../common';
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
            mainSendToRender(this.mainWindow, 'log', '[updater] 开始检测更新');
        });

        autoUpdater.on('update-available', () => {
            mainSendToRender(this.mainWindow, 'log', '[updater] 有更新可以使用');
        });

        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
            mainSendToRender(this.mainWindow, 'log', '[updater] 更新下载完成:', event, releaseNotes, releaseName);
            mainSendToRender(this.mainWindow, 'downloaded', releaseNotes, releaseName);
        });

        autoUpdater.on('error', (error) => {
            mainSendToRender(this.mainWindow, 'log', '[updater] 更新失败:', error);
        });
    }
}
