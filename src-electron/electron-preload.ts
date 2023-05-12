import { contextBridge } from 'electron';
import { Menu, ShellExpose, Std } from './preload/preload';

contextBridge.exposeInMainWorld('shell', ShellExpose);
contextBridge.exposeInMainWorld('std', Std);
contextBridge.exposeInMainWorld('menu', Menu);
