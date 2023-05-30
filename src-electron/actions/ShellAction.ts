import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';
import openEditor from 'open-editor';
import open from 'open';
import { ChildProcess, exec } from 'child_process';
import { simpleGit } from 'simple-git';
import path from 'path';
import fs, { promises } from 'fs';
import os from 'os';
import { RootName } from '../preload/preload';

export default class ShellAction {
    constructor(private mainWindow: BrowserWindow) {
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

        ipcMain.handle(ShellEvent.open, async (e, { cwd, root }) => {
            if (root) {
                cwd = path.join(app.getPath(root), cwd);
            }
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

        ipcMain.handle(
            ShellEvent.git,
            async (
                e,
                {
                    command,
                    cwd,
                    branch,
                    startPoint,
                    mergeFrom,
                }: {
                    command: string;
                    branch?: string;
                    startPoint?: string;
                    cwd: string;
                    mergeFrom?: string[];
                }
            ) => {
                const gitManager = simpleGit(cwd);
                if (command === 'branch') {
                    // 获取分支
                    return await gitManager.branch();
                } else if (command === 'checkout') {
                    // 切换分支
                    if (!branch) {
                        return false;
                    }
                    return await gitManager.checkout(branch);
                } else if (command === 'pull') {
                    return await gitManager.pull();
                } else if (command === 'checkoutBranch' || command === 'checkoutRemoteBranch') {
                    // 创建分支
                    if (!branch) {
                        return false;
                    }
                    // 如果startPoint为空, 则默认为当前分支
                    startPoint = startPoint || (await gitManager.branch()).current;
                    // // 创建分支并提交到远程
                    await gitManager.checkout(startPoint);
                    await gitManager.pull();
                    await gitManager.checkoutLocalBranch(branch);
                    if (command === 'checkoutRemoteBranch') {
                        await gitManager.push('origin', branch, ['--set-upstream']);
                    }
                } else if (command === 'merge') {
                    // 合并分支
                    if (!mergeFrom || !mergeFrom.length || !branch) {
                        return false;
                    }

                    // 串行执行 mergeFrom 分支的合并
                    for await (const item of mergeFrom) {
                        await gitManager.checkout(item);
                        await gitManager.pull();
                        await gitManager.checkout(branch);
                        await gitManager.pull();
                        await gitManager.mergeFromTo(item, branch);
                    }
                }
            }
        );

        ipcMain.handle(ShellEvent.scriptList, async (e, { cwd }) => {
            try {
                const str = await fs.promises.readFile(path.join(cwd, 'package.json'), { encoding: 'utf8' });
                return JSON.parse(str).scripts;
            } catch (error) {
                this.mainWindow.webContents.send('stderr', error);
            }
        });

        ipcMain.handle(ShellEvent.script, async (e, { command, cwd }) => {
            const process = exec(`npm run ${command}`, { cwd, env: {} as NodeJS.ProcessEnv });
            const projectName = path.basename(cwd);
            return await this.dealStdEvent(process, { command, projectName });
        });

        ipcMain.handle(ShellEvent.batchScript, async (e, list: { command: string; cwd: string }[]) => {
            const promiseList = list.map((info) => {
                const { command, cwd } = info;
                const process = exec(`npm run ${command}`, { cwd, env: {} as NodeJS.ProcessEnv });
                const projectName = path.basename(cwd);
                return this.dealStdEvent(process, { command, projectName });
            });

            return await Promise.all(promiseList);
        });

        ipcMain.handle(
            ShellEvent.writeFile,
            async (e, data: { root: RootName; cwd: string; file: string; content: string }) => {
                const { root, cwd, file, content } = data;
                const p = path.join(app.getPath(root), cwd, file || '');
                return await promises.writeFile(p, content, {
                    encoding: 'utf-8',
                });
            }
        );
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
