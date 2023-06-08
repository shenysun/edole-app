import { contextBridge } from 'electron';
import { Menu, ShellExpose, GitExpose, ScriptExpose, App, Updater } from './preload/preload';

contextBridge.exposeInMainWorld('shell', ShellExpose);
contextBridge.exposeInMainWorld('script', ScriptExpose);
contextBridge.exposeInMainWorld('git', GitExpose);
contextBridge.exposeInMainWorld('menu', Menu);
contextBridge.exposeInMainWorld('app', App);
contextBridge.exposeInMainWorld('updater', Updater);
