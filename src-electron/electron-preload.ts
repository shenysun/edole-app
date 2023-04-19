import { contextBridge, ipcRenderer } from 'electron';
import { CommonFunction, ShellEvent, StdEvent } from 'app/src-electron/events/ShellEvent';

contextBridge.exposeInMainWorld('shell', {
    [ShellEvent.test]: () => {
        return ipcRenderer.invoke(ShellEvent.test);
    },

    [ShellEvent.open]: (data: { cwd: string; editor?: string }) => {
        return ipcRenderer.invoke(ShellEvent.open, data);
    },

    [ShellEvent.dialog]: () => {
        return ipcRenderer.invoke(ShellEvent.dialog);
    },

    [ShellEvent.git]: (data: { command: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.git, data);
    },

    [ShellEvent.scriptList]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.scriptList, data);
    },

    [ShellEvent.script]: (data: { command: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.script, data);
    },
});

contextBridge.exposeInMainWorld('std', {
    [StdEvent.on]: (type: 'stdout' | 'stderr', callback: CommonFunction) => {
        ipcRenderer.on(type, callback);
    },
    [StdEvent.off]: (type: 'stdout' | 'stderr', callback: CommonFunction) => {
        return ipcRenderer.off(type, callback);
    },
});
