import { ipcMain } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';
import shelljs from 'shelljs';
import openEditor from 'open-editor';

export default class ShellAction {
    constructor() {
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
    }
}
