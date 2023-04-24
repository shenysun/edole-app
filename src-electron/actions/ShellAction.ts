import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';
import shelljs from 'shelljs';
import openEditor from './OpenEditor';
import open from 'open';
import { ChildProcess } from 'child_process';
import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';
import os from 'os';

export default class ShellAction {
    constructor(private mainWindow: BrowserWindow) {
        const node = shelljs.which('node');
        if (node) {
            shelljs.config.execPath = node.toString();
        }
        this.registerHandler();
    }

    registerHandler() {
        ipcMain.handle(ShellEvent.init, async () => {
            return {
                platform: process.platform || os.platform(),
            };
        });

        ipcMain.handle(ShellEvent.openEditor, async (e, { cwd, editor }) => {
            editor = editor || 'vscode';
            openEditor(
                [
                    {
                        file: cwd,
                    },
                ],
                { editor }
            );
            return shelljs.pwd().stdout;
        });

        ipcMain.handle(ShellEvent.open, async (e, { cwd }) => {
            open(cwd);
            return shelljs.pwd().stdout;
        });

        ipcMain.handle(ShellEvent.dialog, async () => {
            const ds = await dialog.showOpenDialog({
                title: '选择项目',
                properties: ['openDirectory', 'createDirectory', 'multiSelections'],
                message: '选择打开的项目',
            });

            return ds.filePaths.map((item) => {
                return {
                    projectName: path.basename(item),
                    path: item,
                };
            });
        });

        ipcMain.handle(ShellEvent.git, async (e, { command, cwd, branch }) => {
            const gitManager = simpleGit(cwd);
            try {
                if (command === 'branch') {
                    const bs = await gitManager.branch();
                    return bs;
                } else if (command === 'checkout') {
                    const b = await gitManager.checkout(branch);
                    return b;
                }
            } catch (error) {
                this.mainWindow.webContents.send('stderr', error);
            }
        });

        ipcMain.handle(ShellEvent.scriptList, async (e, { cwd }) => {
            try {
                const str = await fs.promises.readFile(path.join(cwd, 'package.json'), { encoding: 'utf8' });
                return JSON.parse(str).scripts;
            } catch (error) {
                this.mainWindow.webContents.send('stderr', error);
            }
        });

        ipcMain.handle(ShellEvent.script, async (e, { command, cwd }) => {
            const process = shelljs.exec(`npm run ${command}`, {
                cwd,
                async: true,
                silent: true,
            });

            const projectName = path.basename(cwd);
            const res = await this.dealStdEvent(process, { command, projectName });
            return res;
        });

        ipcMain.handle(ShellEvent.batchScript, async (e, list: { command: string; cwd: string }[]) => {
            const promiseList = list.map((info) => {
                const { command, cwd } = info;
                const process = shelljs.exec(`npm run ${command}`, {
                    cwd,
                    async: true,
                    silent: true,
                });
                const projectName = path.basename(cwd);
                return this.dealStdEvent(process, { command, projectName });
            });

            const ress = await Promise.all(promiseList);
            return ress;
        });
    }

    dealStdEvent(process: ChildProcess, { command, projectName }: { command: string; projectName: string }) {
        return new Promise((resolve, reject) => {
            const { stdout, stderr } = process;
            const onStdOut = (chunk: unknown) => {
                this.mainWindow.webContents.send('stdout', chunk);
            };

            const onStdErr = (chunk: unknown) => {
                this.mainWindow.webContents.send('stderr', chunk);
            };

            stdout?.on('data', onStdOut);
            stderr?.on('data', onStdErr);

            process.once('exit', (code) => {
                stderr?.off('data', onStdOut);
                stderr?.off('data', onStdErr);
                if (code === 0) {
                    resolve({ command, projectName });
                } else {
                    reject(code);
                }
            });

            process.once('error', (reason) => {
                reject(reason);
            });
        });
    }
}
