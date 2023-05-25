/**
 * 远程分支名字转换为本地名 remotes/origin/dev -> dev
 * @param remoteBranch
 * @returns
 */
export function remoteBranchToLocal(remoteBranch: string): string {
    return remoteBranch.replace(/remotes\/origin\//, '');
}
