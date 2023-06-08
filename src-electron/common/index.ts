import { BrowserWindow } from 'electron';
import { TypeAppMonitorEvent } from '../events/ShellEvent';

/**
 * 主进程到渲染进程发送消息
 * @param w
 * @param type
 * @param args
 */
export function mainSendToRender(w: BrowserWindow | undefined, type: TypeAppMonitorEvent, ...args: unknown[]) {
    w?.webContents.send(type, ...args);
}
