import { contextBridge } from 'electron';
import { Menu, ShellExpose, GitExpose, Std, ScriptExpose } from './preload/preload';

contextBridge.exposeInMainWorld('shell', ShellExpose);
contextBridge.exposeInMainWorld('script', ScriptExpose);
contextBridge.exposeInMainWorld('git', GitExpose);
contextBridge.exposeInMainWorld('std', Std);
contextBridge.exposeInMainWorld('menu', Menu);
