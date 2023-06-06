import { BrowserWindow, ipcMain } from 'electron';
import simpleGit, { SimpleGit } from 'simple-git';
import { GitEvent } from '../events/ShellEvent';

export default class GitAction {
    cache = new Map<string, SimpleGit>();
    abortCache = new Map<string, AbortController>();

    constructor(private mainWindow: BrowserWindow) {
        this.registerHandler();
    }

    registerHandler() {
        ipcMain.handle(GitEvent.branch, async (e, { cwd }) => {
            return this.branch(cwd);
        });

        ipcMain.handle(GitEvent.checkout, async (e, { cwd, branch }) => {
            return this.checkout(cwd, branch);
        });

        ipcMain.handle(GitEvent.pull, async (e, { cwd }) => {
            return this.pull(cwd);
        });

        ipcMain.handle(GitEvent.checkoutBranch, async (e, { cwd, branch, startPoint }) => {
            return this.checkoutBranch(cwd, branch, startPoint);
        });

        ipcMain.handle(GitEvent.checkoutRemoteBranch, async (e, { cwd, branch, startPoint }) => {
            return this.checkoutRemoteBranch(cwd, branch, startPoint);
        });

        ipcMain.handle(GitEvent.merge, async (e, { cwd, branch, mergeFrom }) => {
            return this.merge(cwd, branch, mergeFrom);
        });

        ipcMain.handle(GitEvent.diff, (e, { cwd }) => {
            return this.checkDiffName(cwd);
        });

        ipcMain.handle(GitEvent.status, async (e, { cwd }) => {
            const s = await this.status(cwd);
            // 冲突，新增，删除，修改，已暂存，本地 commit > 远端，远端 > 本地
            const { conflicted, not_added, deleted, modified, staged, ahead, behind, current, tracking } = s;
            return {
                conflicted,
                not_added,
                deleted,
                modified,
                staged,
                ahead,
                behind,
                current,
                tracking,
            };
        });

        ipcMain.handle(GitEvent.abort, async (e, { cwd, reason }) => {
            this.abort(cwd, reason);
        });
    }

    public getGitHandle(cwd: string) {
        if (!this.cache.has(cwd)) {
            const controller = new AbortController();
            this.cache.set(cwd, simpleGit(cwd, { abort: controller.signal }));
            this.abortCache.set(cwd, controller);
        }

        return this.cache.get(cwd) as SimpleGit;
    }

    public abort(cwd: string, reason?: string) {
        if (this.abortCache.has(cwd)) {
            this.abortCache.get(cwd)?.abort(reason);
        }
    }

    public async branch(cwd: string) {
        const gitManager = this.getGitHandle(cwd);
        return gitManager.branch();
    }

    public async checkout(cwd: string, branch: string) {
        const gitManager = this.getGitHandle(cwd);
        return gitManager.checkout(branch);
    }

    public async pull(cwd: string) {
        const gitManager = this.getGitHandle(cwd);
        return gitManager.pull();
    }

    public async checkoutBranch(cwd: string, branch: string, startPoint?: string) {
        const gitManager = this.getGitHandle(cwd);
        startPoint = startPoint || (await gitManager.branch()).current;
        await gitManager.checkout(startPoint);
        await gitManager.pull();
        await gitManager.checkoutLocalBranch(branch);
    }

    public async checkoutRemoteBranch(cwd: string, branch: string, startPoint?: string) {
        const gitManager = this.getGitHandle(cwd);
        startPoint = startPoint || (await gitManager.branch()).current;
        await gitManager.checkout(startPoint);
        await gitManager.pull();
        await gitManager.checkoutLocalBranch(branch);
        await gitManager.push('origin', branch, ['--set-upstream']);
    }

    public async merge(cwd: string, branch: string, mergeFrom: string[]) {
        const gitManager = this.getGitHandle(cwd);
        for await (const item of mergeFrom) {
            await gitManager.checkout(item);
            await gitManager.pull();
            await gitManager.checkout(branch);
            await gitManager.pull();
            await gitManager.mergeFromTo(item, branch);
        }
    }

    /**
     * 查看冲突文件
     */
    public async checkDiffName(cwd: string) {
        const gitManager = this.getGitHandle(cwd);
        return gitManager.diff(['--name-only', '--diff-filter=U']);
    }

    public async status(cwd: string) {
        const gitManager = this.getGitHandle(cwd);
        return gitManager.status();
    }

    public async push(cwd: string, branch: string) {
        const gitManager = this.getGitHandle(cwd);
        await gitManager.push('origin', branch);
    }

    public async add(cwd: string, files: string[]) {
        const gitManager = this.getGitHandle(cwd);
        await gitManager.add(files);
    }

    public async commit(cwd: string, message: string) {
        const gitManager = this.getGitHandle(cwd);
        await gitManager.commit(message);
    }
}
