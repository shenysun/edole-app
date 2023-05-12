import { ipcRenderer } from 'electron';
import { IpcFunction, MenuEvent, ShellEvent, StdEvent } from '../events/ShellEvent';
export const ShellExpose = {
    [ShellEvent.init]: () => {
        return ipcRenderer.invoke(ShellEvent.init);
    },

    [ShellEvent.openEditor]: (data: { cwd: string; editor?: string }) => {
        return ipcRenderer.invoke(ShellEvent.openEditor, data);
    },

    [ShellEvent.open]: (data: { cwd: string; root?: RootName }) => {
        return ipcRenderer.invoke(ShellEvent.open, data);
    },

    [ShellEvent.dialog]: () => {
        return ipcRenderer.invoke(ShellEvent.dialog);
    },

    [ShellEvent.git]: (data: { command: string; branch?: string; startPoint?: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.git, data);
    },

    [ShellEvent.scriptList]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.scriptList, data);
    },

    [ShellEvent.script]: (data: { command: string; cwd: string }) => {
        return ipcRenderer.invoke(ShellEvent.script, data);
    },

    [ShellEvent.batchScript]: (list: { command: string; cwd: string }[]) => {
        return ipcRenderer.invoke(ShellEvent.batchScript, list);
    },

    [ShellEvent.writeFile]: (data: { root: RootName; cwd: string; file: string; content: string }) => {
        return ipcRenderer.invoke(ShellEvent.writeFile, data);
    },
};

export const Std = {
    [StdEvent.on]: (type: 'stdout' | 'stderr', callback: IpcFunction) => {
        ipcRenderer.on(type, callback);
    },

    [StdEvent.off]: (type: 'stdout' | 'stderr', callback: IpcFunction) => {
        return ipcRenderer.off(type, callback);
    },
};

export const Menu = {
    [MenuEvent.context]: () => {
        ipcRenderer.send(MenuEvent.context);
    },
    [MenuEvent.on]: (type: 'menu', callback: IpcFunction) => {
        ipcRenderer.on(type, callback);
    },
    [MenuEvent.off]: (type: string, callback: IpcFunction) => {
        ipcRenderer.off(type, callback);
    },
};

export interface TypeExpose {
    shell: typeof ShellExpose;
    std: typeof Std;
    menu: typeof Menu;
}

export type RootName =
    | 'home'
    | 'appData'
    | 'userData'
    | 'sessionData'
    | 'temp'
    | 'exe'
    | 'module'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos'
    | 'recent'
    | 'logs'
    | 'crashDumps';
