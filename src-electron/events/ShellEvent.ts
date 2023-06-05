import { IpcRendererEvent } from 'electron';

export enum ShellEvent {
    getOS = 'getOS',
    open = 'open',
    openEditor = 'openEditor',
    dialog = 'dialog',
    writeFile = 'writeFile',
}

export enum ScriptEvent {
    package_script = 'package_script',
    binary = 'binary',
    run = 'run',
    stop = 'stop',
    stopAll = 'stopAll',
}

export enum GitEvent {
    branch = 'branch',
    checkout = 'checkout',
    pull = 'pull',
    checkoutBranch = 'checkoutBranch',
    checkoutRemoteBranch = 'checkoutRemoteBranch',
    merge = 'merge',
    diff = 'diff',
    abort = 'abort',
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
