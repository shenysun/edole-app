import { BuildEnv } from 'src/pages/main/meta';

export const noneScript = '不执行脚本';
export const defaultBuildCommand = 'build:test';
export const mbBuildCommand = 'build';
export const coursewarelibraryPlatform = {
    win32: 'buildwin:local',
    darwin: 'build:local',
};
export const dataviewlibraryPlatform = {
    win32: 'libwin:test',
    darwin: 'lib:test',
};

export const baselibraryBuildEnv: Record<BuildEnv, string> = {
    'test:ld': 'build:test',
    'prod:ld': 'build:prod',
    'test:sy': 'build:sy:test',
    'prod:sy': 'build:sy:prod',
};

export const getBuildCommand = (projectName: string, env: BuildEnv, platform: string) => {
    if (projectName.indexOf('baselibrary') > -1) {
        return baselibraryBuildEnv[env];
    }

    if (projectName.indexOf('coursewarelibrary') > -1) {
        return (coursewarelibraryPlatform as never)[platform];
    }

    if (projectName.indexOf('dataviewlibrary') > -1) {
        return (dataviewlibraryPlatform as never)[platform];
    }

    if (projectName.indexOf('baseframe') > -1) {
        return noneScript;
    }

    if (projectName.indexOf('messagebox') > -1) {
        return mbBuildCommand;
    }

    return defaultBuildCommand;
};
