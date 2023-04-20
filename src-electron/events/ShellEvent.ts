export enum ShellEvent {
    test = 'test',
    open = 'open',
    openEditor = 'openEditor',
    dialog = 'dialog',
    git = 'git',
    scriptList = 'scriptList',
    script = 'script',
    batchScript = 'batchScript',
}

export enum StdEvent {
    on = 'on',
    off = 'off',
}

export type CommonFunction<RT = void> = (...args: any[]) => RT;
