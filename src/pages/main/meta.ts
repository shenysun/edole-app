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
