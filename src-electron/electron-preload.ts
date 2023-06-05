import { contextBridge } from 'electron';
import { Menu, ShellExpose, GitExpose, Std } from './preload/preload';

contextBridge.exposeInMainWorld('shell', ShellExpose);
contextBridge.exposeInMainWorld('git', GitExpose);
contextBridge.exposeInMainWorld('std', Std);
contextBridge.exposeInMainWorld('menu', Menu);
