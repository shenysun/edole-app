export enum ShellEvent {
    test = 'test',
    open = 'open',
    dialog = 'dialog',
    git = 'git',
    scriptList = 'scriptList',
    script = 'script',
}

export enum StdEvent {
    on = 'on',
    off = 'off',
}

export type CommonFunction<RT = undefined> = (...args: unknown[]) => RT;
