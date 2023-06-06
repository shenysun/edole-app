import { ipcRenderer } from 'electron';
import { GitEvent, ScriptEvent, IpcFunction, MenuEvent, ShellEvent, ListenerEvent } from '../events/ShellEvent';
export const ShellExpose = {
    [ShellEvent.getOS]: () => {
        return ipcRenderer.invoke(ShellEvent.getOS);
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

    [ShellEvent.writeFile]: (data: { root: RootName; cwd: string; file: string; content: string }) => {
        return ipcRenderer.invoke(ShellEvent.writeFile, data);
    },
};

export const ScriptExpose = {
    [ScriptEvent.package_script]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(ScriptEvent.package_script, data);
    },

    [ScriptEvent.binary]: (data: { binary: string }) => {
        return ipcRenderer.invoke(ScriptEvent.binary, data);
    },

    [ScriptEvent.run]: (data: { cwd: string; command: string }) => {
        return ipcRenderer.invoke(ScriptEvent.run, data);
    },

    [ScriptEvent.stop]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(ScriptEvent.stop, data);
    },

    [ScriptEvent.stopAll]: () => {
        return ipcRenderer.invoke(ScriptEvent.stopAll);
    },
};

export const GitExpose = {
    [GitEvent.branch]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(GitEvent.branch, data);
    },

    [GitEvent.checkout]: (data: { cwd: string; branch: string }) => {
        return ipcRenderer.invoke(GitEvent.checkout, data);
    },

    [GitEvent.pull]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(GitEvent.pull, data);
    },

    [GitEvent.checkoutBranch]: (data: { cwd: string; branch: string; startPoint?: string }) => {
        return ipcRenderer.invoke(GitEvent.checkoutBranch, data);
    },

    [GitEvent.checkoutRemoteBranch]: (data: { cwd: string; branch: string; startPoint?: string }) => {
        return ipcRenderer.invoke(GitEvent.checkoutRemoteBranch, data);
    },

    [GitEvent.merge]: (data: { cwd: string; branch: string; mergeFrom: string[] }) => {
        return ipcRenderer.invoke(GitEvent.merge, data);
    },

    [GitEvent.diff]: (data: { cwd: string }) => {
        return ipcRenderer.invoke(GitEvent.diff, data);
    },

    [GitEvent.abort]: (data: { cwd: string; reason?: string }) => {
        return ipcRenderer.invoke(GitEvent.abort, data);
    },
};

export const Std = {
    [ListenerEvent.on]: (type: 'stdout' | 'stderr', callback: IpcFunction) => {
        ipcRenderer.on(type, callback);
    },

    [ListenerEvent.off]: (type: 'stdout' | 'stderr', callback: IpcFunction) => {
        return ipcRenderer.off(type, callback);
    },
};

export const Menu = {
    [MenuEvent.context]: (data: { x: number; y: number }) => {
        ipcRenderer.send(MenuEvent.context, data);
    },
    [ListenerEvent.on]: (type: 'menu', callback: IpcFunction) => {
        ipcRenderer.on(type, callback);
    },
    [ListenerEvent.off]: (type: string, callback: IpcFunction) => {
        ipcRenderer.off(type, callback);
    },
};

export const App = {
    [ListenerEvent.on]: (type: string, callback: IpcFunction) => {
        ipcRenderer.on(type, callback);
    },
    [ListenerEvent.off]: (type: string, callback: IpcFunction) => {
        ipcRenderer.off(type, callback);
    },
};

export interface TypeExpose {
    shell: typeof ShellExpose;
    script: typeof ScriptExpose;
    git: typeof GitExpose;
    std: typeof Std;
    menu: typeof Menu;
    app: typeof App;
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
