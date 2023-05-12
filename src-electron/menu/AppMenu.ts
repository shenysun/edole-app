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
        ipcMain.on(MenuEvent.context, (event) => {
            const template: Array<MenuItemConstructorOptions | MenuItem> = [
                {
                    label: 'Menu Item 1',
                    click: () => {
                        console.log('nihao');
                    },
                },
                { type: 'separator' },
                { label: 'Menu Item 2', type: 'checkbox', checked: true },
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
