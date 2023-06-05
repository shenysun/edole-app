import { ChildProcess, exec } from 'child_process';
import { BrowserWindow, ipcMain } from 'electron';
import { promises } from 'fs';
import { basename, join } from 'path';
import { ScriptEvent } from '../events/ShellEvent';

export default class ScriptAction {
    binary = 'npm';
    processCache = new Map<string, ChildProcess>();

    constructor(private mainWindow: BrowserWindow) {
        this.registerHandler();
    }

    registerHandler() {
        ipcMain.handle(ScriptEvent.binary, (e, { binary }) => {
            this.setBinary(binary);
            return binary;
        });

        ipcMain.handle(ScriptEvent.package_script, async (e, { cwd }) => {
            return this.readScripts(cwd);
        });

        ipcMain.handle(ScriptEvent.run, async (e, { command, cwd }) => {
            return this.run(command, cwd);
        });

        ipcMain.handle(ScriptEvent.stop, async (e, { cwd }) => {
            return this.stop(cwd);
        });

        ipcMain.handle(ScriptEvent.stopAll, async () => {
            return this.stopAll();
        });
    }

    setBinary(binary: string) {
        this.binary = binary;
    }

    async readScripts(cwd: string) {
        try {
            const str = await promises.readFile(join(cwd, 'package.json'), { encoding: 'utf8' });
            return JSON.parse(str).scripts;
        } catch (error) {
            return {};
        }
    }

    async run(command: string, cwd: string) {
        const process = exec(`${this.binary} run ${command}`, { cwd, env: {} as NodeJS.ProcessEnv });
        this.processCache.set(cwd, process);
        const projectName = basename(cwd);
        const info = await this.dealStdEvent(process, { command, projectName });
        this.processCache.delete(cwd);
        return info;
    }

    stop(cwd: string) {
        const process = this.processCache.get(cwd);
        if (process) {
            process.kill();
            this.processCache.delete(cwd);
        }
    }

    stopAll() {
        this.processCache.forEach((process) => {
            process.kill();
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
