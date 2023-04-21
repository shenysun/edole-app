import { BuildEnv } from 'src/pages/main/meta';

export const defaultBuildCommand = 'build:test';
export const coursewarelibraryPlatform = {
    win32: 'buildwin:local',
    darwin: 'build:local',
};

export const baselibraryBuildEnv = {
    test: 'build:test',
    prod: 'build:prod',
};

export const getBuildCommand = (projectName: string, env: BuildEnv, platform: string) => {
    if (projectName.indexOf('baselibrary') > -1) {
        return baselibraryBuildEnv[env];
    }

    if (projectName.indexOf('coursewarelibrary') > -1) {
        return (coursewarelibraryPlatform as never)[platform];
    }

    return defaultBuildCommand;
};
