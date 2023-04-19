import { contextBridge, ipcRenderer } from 'electron';
import { CommonFunction, ShellEvent, StdEvent } from 'app/src-electron/events/ShellEvent';

contextBridge.exposeInMainWorld('shell', {
    [ShellEvent.test]: () => {
        return ipcRenderer.invoke(ShellEvent.test);
    },

    [ShellEvent.dialog]: () => {
        return ipcRenderer.invoke(ShellEvent.dialog);
    },

    [ShellEvent.git]: (data: { command: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.git, data);
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
