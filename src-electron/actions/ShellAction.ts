import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';
import shelljs from 'shelljs';
import openEditor from 'open-editor';
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
        });

        ipcMain.handle(ShellEvent.open, async (e, { cwd }) => {
            console.log('测试提交代码');
            await open(cwd);
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
            // gitManager.diffSummary();
            // 使用 gitManager 的 diff 方法, 输出冲突文件
            // const m = await gitManager.diff(['--name-only', '--diff-filter=U']);
            // gitManager.status();
            // console.log(m);
            try {
                if (command === 'branch') {
                    return await gitManager.branch();
                } else if (command === 'checkout') {
                    return await gitManager.checkout(branch);
                } else if (command === 'pull') {
                    return await gitManager.pull();
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
            return await this.dealStdEvent(process, { command, projectName });
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

            return await Promise.all(promiseList);
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
                    reject(`${projectName}执行${command}失败, code: ${code}`);
                }
            });

            process.once('error', (reason) => {
                reject(`${projectName}执行${command}失败, reason: ${reason}`);
            });
        });
    }
}
