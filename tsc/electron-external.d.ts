declare namespace Electron {
    interface ContextBridge {
        exposeInMainWorld(apiKey: string, api: any): void;
    }
}
