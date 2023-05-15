<template>
    <div class="global-actions"></div>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';
import { Dialog } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { getLocalRootFile } from 'src/common/utils/localFile';
import { onMounted, onUnmounted } from 'vue';

const href = useLocalStorage('latestHref', 'http://localhost:8080');

const onContextMenu = (e: PointerEvent) => {
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
                await electronExpose.shell.writeFile({
                    root: 'home',
                    cwd: `AppData/Local/owcrclient/wcropenclassroom/localpages/${dirName}`,
                    file: 'index.html',
                    content: getLocalRootFile(data),
                });
                href.value = data;
                toast.show('修改成功', 'done');
            });

            break;

        default:
            break;
    }
};
onMounted(() => {
    window.addEventListener('contextmenu', onContextMenu);
    electronExpose.menu.on('menu', onMenuAction);
});

onUnmounted(() => {
    window.removeEventListener('contextmenu', onContextMenu);
    electronExpose.menu.off('menu', onMenuAction);
});
</script>
<style scoped></style>
