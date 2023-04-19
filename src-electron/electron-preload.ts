import { contextBridge } from 'electron';
import { ShellExpose, Std } from './preload/preload';

contextBridge.exposeInMainWorld('shell', ShellExpose);
contextBridge.exposeInMainWorld('std', Std);
