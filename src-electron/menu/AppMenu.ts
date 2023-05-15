import { BrowserWindow, ipcMain, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { MenuEvent } from '../events/ShellEvent';

/**
 * 菜单相关功能
 */
export class AppMenu {
    constructor(private platform: string) {
        this.initMenuBar();
        this.initContextMenu();
    }

    private initMenuBar() {
        const templateWin: Array<MenuItemConstructorOptions | MenuItem> = [
            {
                label: '功能',
                submenu: [
                    {
                        label: '打开授课端根目录',
                        click: () => this.sendOpenRoot(),
                    },
                    {
                        label: '修改授课入口文件',
                        submenu: [
                            {
                                label: '乐读',
                                click: () => this.sendWriteIndex('vdyooo'),
                            },
                            {
                                label: '素养',
                                click: () => this.sendWriteIndex('speiyou'),
                            },
                        ],
                    },
                ],
            },
        ];
        const menuWin = Menu.buildFromTemplate(templateWin);
        Menu.setApplicationMenu(menuWin);
    }

    private initContextMenu() {
        ipcMain.on(MenuEvent.context, (event, data) => {
            const template: Array<MenuItemConstructorOptions | MenuItem> = [
                {
                    label: '打开调试工具',
                    click: () => {
                        const webContents = view?.webContents;
                        if (webContents) {
                            if (webContents.isDevToolsOpened()) {
                                return;
                            }
                            webContents.openDevTools({ mode: 'detach', activate: true });
                        }
                    },
                },
                {
                    label: '关闭调试工具',
                    click: () => {
                        const webContents = view?.webContents;
                        if (webContents) {
                            if (webContents.isDevToolsOpened()) {
                                webContents.closeDevTools();
                            }
                        }
                    },
                },
                { type: 'separator' },
                {
                    label: '检查元素',
                    click: () => {
                        view?.webContents.inspectElement(data.x, data.y);
                    },
                },
            ];
            const menu = Menu.buildFromTemplate(template);
            const sender = event.sender;
            const view = BrowserWindow.fromWebContents(sender);
            view && menu.popup({ window: view });
        });
    }

    private get windows() {
        return BrowserWindow.getAllWindows();
    }

    private sendOpenRoot() {
        this.windows.forEach((win) => {
            win.webContents.send('menu', { type: 'open-root' });
        });
    }

    private sendWriteIndex(client: string) {
        this.windows.forEach((win) => {
            win.webContents.send('menu', { type: 'write-index', client });
        });
    }
}
