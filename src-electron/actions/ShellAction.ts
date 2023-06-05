import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';
import openEditor from 'open-editor';
import open from 'open';
import { promises } from 'fs';
import os from 'os';
import { RootName } from '../preload/preload';
import { basename, join } from 'path';

export default class ShellAction {
    constructor(private mainWindow: BrowserWindow) {
        this.registerHandler();
    }

    registerHandler() {
        ipcMain.handle(ShellEvent.getOS, async () => {
            return this.getOS();
        });

        ipcMain.handle(ShellEvent.openEditor, async (e, { cwd, editor }) => {
            return this.openEditor(cwd, editor);
        });

        ipcMain.handle(ShellEvent.open, async (e, { cwd, root }) => {
            return this.open(cwd, root);
        });

        ipcMain.handle(ShellEvent.dialog, async () => {
            return this.dialog();
        });

        ipcMain.handle(ShellEvent.writeFile, async (e, { root, cwd, file, content }) => {
            return this.writeFile(root, cwd, file, content);
        });
    }

    getOS() {
        return {
            platform: process.platform || os.platform(),
        };
    }

    openEditor(cwd: string, editor?: string) {
        editor = editor || 'vscode';
        openEditor(
            [
                {
                    file: cwd,
                },
            ],
            { editor }
        );
    }

    async open(cwd: string, root?: never) {
        if (root) {
            cwd = join(app.getPath(root), cwd);
        }

        return open(cwd);
    }

    async dialog() {
        const ds = await dialog.showOpenDialog({
            title: '选择项目',
            properties: ['openDirectory', 'createDirectory', 'multiSelections'],
            message: '选择打开的项目',
        });

        return ds.filePaths.map((item) => {
            return {
                projectName: basename(item),
                path: item,
            };
        });
    }

    async writeFile(root: RootName, cwd: string, file: string, content: string) {
        const p = join(app.getPath(root), cwd, file || '');
        return promises.writeFile(p, content, {
            encoding: 'utf-8',
        });
    }
}
