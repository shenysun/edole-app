<template>
    <div class="global-actions"></div>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';
import { Dialog } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { getLocalRootFile } from 'src/common/utils/localFile';
import { useGroupStore } from 'src/stores/group';
import { useOSStore } from 'src/stores/os';
import { useProjectStore } from 'src/stores/project';
import { onMounted, onUnmounted } from 'vue';

const href = useLocalStorage('latestHref', 'http://localhost:8080');
const groupStore = useGroupStore();
const projectStore = useProjectStore();
const os = useOSStore();

const onContextMenu = (e: MouseEvent) => {
    electronExpose.menu.context({ x: e.clientX, y: e.clientY });
};
const onMenuAction = (_sender: unknown, args: { type: string; [key: string]: unknown }) => {
    const { type } = args;
    switch (type) {
        case 'open-root':
            // 弹出quasar的文件选择器
            electronExpose.shell.open({
                root: 'home',
                cwd: 'AppData/Local/owcrclient/wcropenclassroom',
            });
            break;
        case 'write-index':
            const client = args.client;
            let dirName = 'saas_teacher';
            switch (client) {
                case 'vdyoo':
                    dirName = 'saas_teacher';
                    break;
                case 'speiyou':
                    dirName = 'newxesteacher-0';
                    break;

                default:
                    break;
            }

            Dialog.create({
                title: '入口文件修改',
                message: '输入目标地址',
                prompt: {
                    model: href.value,
                    type: 'text',
                    required: true,
                },
                cancel: '取消',
                ok: '确定',
                persistent: true,
            }).onOk(async (data) => {
                try {
                    await electronExpose.shell.writeFile({
                        root: 'home',
                        cwd: `AppData/Local/owcrclient/wcropenclassroom/localpages/${dirName}`,
                        file: 'index.html',
                        content: getLocalRootFile(data),
                    });

                    href.value = data;
                    toast.show('修改成功', 'done');
                } catch (error) {
                    toast.show('修改失败', 'error');
                }
            });

            break;

        default:
            break;
    }
};

const onWindowFocus = () => {
    groupStore.currentProjectList?.forEach((projectInfo) => {
        const { projectName, path } = projectInfo;
        electronExpose.git.branch({ cwd: path }).then((info) => {
            projectStore.setBranchInfo(projectName, info);
        });
    });
};

const onAppLog = (e: unknown, ...args: unknown[]) => {
    console.log('app-log:', ...args);
};

const onAppDownloaded = (e: unknown, releaseNotes: string, releaseName: string) => {
    Dialog.create({
        title: '更新',
        message: os.platform === 'win32' ? releaseNotes : releaseName,
        ok: '退出并更新',
        cancel: '取消',
    }).onOk(() => {
        electronExpose.updater.quitAndInstall();
    });
};

onMounted(() => {
    window.addEventListener('contextmenu', onContextMenu);
    electronExpose.menu.on('menu', onMenuAction);
    electronExpose.app.on('focus', onWindowFocus);
    electronExpose.app.on('log', onAppLog);
    electronExpose.updater.on('downloaded', onAppDownloaded);
});

onUnmounted(() => {
    window.removeEventListener('contextmenu', onContextMenu);
    electronExpose.menu.off('menu', onMenuAction);
    electronExpose.app.off('focus', onWindowFocus);
    electronExpose.app.off('log', onAppLog);
    electronExpose.updater.off('downloaded', onAppDownloaded);
});
</script>
<style scoped></style>
