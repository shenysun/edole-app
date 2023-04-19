import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';
import shelljs from 'shelljs';
import openEditor from 'open-editor';
import { ChildProcess } from 'child_process';

export default class ShellAction {
    constructor(private mainWindow: BrowserWindow) {
        const node = shelljs.which('node');
        if (node) {
            shelljs.config.execPath = node.toString();
        }
        this.registerHandler();
    }

    registerHandler() {
        ipcMain.handle(ShellEvent.test, async () => {
            openEditor(
                [
                    {
                        file: 'D:/workspace/personal',
                    },
                ],
                { editor: 'vscode' }
            );
            return shelljs.pwd().stdout;
        });

        ipcMain.handle(ShellEvent.dialog, async () => {
            const ds = await dialog.showOpenDialog({
                title: '选择项目',
                properties: ['openDirectory', 'createDirectory'],
                message: '选择打开的项目',
            });

            return ds.filePaths[0];
        });

        ipcMain.handle(ShellEvent.git, async (e, { command, cwd }) => {
            console.log('command', command);

            const process = shelljs.exec(`git ${command}`, {
                cwd,
                async: true,
                silent: true,
            });

            this.dealStdEvent(process);
        });

        ipcMain.handle(ShellEvent.script, async (e, { command, cwd }) => {
            const process = shelljs.exec(`npm run ${command}`, {
                cwd,
                async: true,
                silent: true,
            });

            this.dealStdEvent(process);
        });
    }

    dealStdEvent(process: ChildProcess) {
        const { stdout, stderr } = process;
        const onStdOut = (chunk: unknown) => {
            this.mainWindow.webContents.send('stdout', chunk);
        };

        const onStdErr = (chunk: unknown) => {
            this.mainWindow.webContents.send('stderr', chunk);
        };

        stdout?.on('data', onStdOut);
        stderr?.on('data', onStdErr);

        process.once('exit', () => {
            stderr?.off('data', onStdOut);
            stderr?.off('data', onStdErr);
        });
    }
}
