import { IpcRendererEvent } from 'electron';

export enum ShellEvent {
    init = 'init',
    open = 'open',
    openEditor = 'openEditor',
    dialog = 'dialog',
    git = 'git',
    scriptList = 'scriptList',
    script = 'script',
    batchScript = 'batchScript',
    writeFile = 'writeFile',
}

export enum StdEvent {
    on = 'on',
    off = 'off',
}

export enum MenuEvent {
    context = 'context',
    on = 'on',
    off = 'off',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommonFunction<RT = void> = (...args: any[]) => RT;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IpcFunction<RT = void> = (event: IpcRendererEvent, ...args: any[]) => RT;
