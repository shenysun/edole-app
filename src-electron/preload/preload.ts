import { ipcRenderer } from 'electron';
import { CommonFunction, ShellEvent, StdEvent } from '../events/ShellEvent';
export const ShellExpose = {
    [ShellEvent.test]: () => {
        return ipcRenderer.invoke(ShellEvent.test);
    },

    [ShellEvent.open]: (data: { cwd: string; editor?: string }) => {
        return ipcRenderer.invoke(ShellEvent.open, data);
    },

    [ShellEvent.dialog]: () => {
        return ipcRenderer.invoke(ShellEvent.dialog);
    },

    [ShellEvent.git]: (data: { command: string; branch?: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.git, data);
    },

    [ShellEvent.scriptList]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.scriptList, data);
    },

    [ShellEvent.script]: (data: { command: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.script, data);
    },
};

export const Std = {
    [StdEvent.on]: (type: 'stdout' | 'stderr' | 'stdexit', callback: CommonFunction) => {
        ipcRenderer.on(type, callback);
    },

    [StdEvent.off]: (type: 'stdout' | 'stderr' | 'stdexit', callback: CommonFunction) => {
        return ipcRenderer.off(type, callback);
    },
};

export interface TypeExpose {
    shell: typeof ShellExpose;
    std: typeof Std;
}
