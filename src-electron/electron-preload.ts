import { contextBridge, ipcRenderer } from 'electron';
import { ShellEvent } from 'app/src-electron/events/ShellEvent';

contextBridge.exposeInMainWorld('shell', {
    do: () => {
        // shell.echo('Error: Git commit failed');
        return ipcRenderer.invoke(ShellEvent.test);
    },
});
