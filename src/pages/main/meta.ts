/**
 * 日志等级
 */
export enum LogLevel {
    log, // 日志
    warning, // 警告
    error, // 错误
}

/**
 * 日志信息
 */
export type LogInfo = {
    message: string;
    level?: LogLevel;
};

/**
 * 工程组信息
 */
export type GroupInfo = {
    groupName: string;
    projects: ProjectInfo[];
};

/**
 * 工程项目信息
 */
export interface ProjectInfo {
    path: string;
    projectName: string;
}

/**
 * 工程分支信息
 */
export type ProjectBranchInfo = {
    detached: boolean;
    current: string;
    all: string[];
    branches: {
        [key: string]: BranchSummaryBranch;
    };
};

export interface BranchSummaryBranch {
    current: boolean;
    name: string;
    commit: string;
    label: string;
    linkedWorkTree: boolean;
    isRemote: boolean;
}
/**
 * 工程构建环境
 */
export type BuildEnv = 'test:ld' | 'prod:ld' | 'test:sy' | 'prod:sy';
/**
 * 批量执行类型
 */
export type BatchType = 'branch' | 'script' | 'merge' | '';
/**
 * 执行状态 = 不执行 | 未开始 | 开始 | 成功 | 失败
 */
export type ExecStatus = 'none' | 'not-start' | 'start' | 'success' | 'error';
