<template>
    <div class="project-header">
        <q-btn class="tools-btn" color="secondary" label="添加项目" rounded @click="onAddClick"></q-btn>
        <q-btn class="tools-btn" color="secondary" label="执行脚本" rounded @click="batchType = 'script'"></q-btn>
        <q-btn class="tools-btn" color="secondary" label="创建分支" rounded @click="batchType = 'branch'"></q-btn>
        <q-btn class="tools-btn" color="secondary" label="合并分支" rounded @click="batchType = 'merge'"></q-btn>
        <q-btn class="tools-btn" color="secondary" label="更新代码" rounded @click="batchPullClick"></q-btn>
    </div>
    <q-dialog v-model="isShowBatch" persistent>
        <batch-dialog :type="batchType"></batch-dialog>
    </q-dialog>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { Loading } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useGroupStore } from 'src/stores/group';
import { computed, ref } from 'vue';
import { BatchType } from '../meta';
import BatchDialog from './batch-dialog.vue';

const groupStore = useGroupStore();
const batchType = ref<BatchType>('');
const { currentProjectList, selectGroup } = storeToRefs(groupStore);

const isShowBatch = computed({
    get: () => batchType.value !== '',
    set: (val) => {
        if (!val) {
            batchType.value = '';
        }
    },
});

const onAddClick = async () => {
    if (!selectGroup.value) {
        toast.show('请先添加一个组', 'error');
        return;
    }
    const projectInfoList = await electronExpose.shell.dialog();
    const curAddList = [];
    for (const projectInfo of projectInfoList) {
        const res = groupStore.addGroupProject(projectInfo);
        if (res) {
            curAddList.push(projectInfo.projectName);
        }
    }

    if (!curAddList.length) {
        return;
    }
    toast.show(`${curAddList.join(',')} 项目添加成功`, 'done');
};

const batchPullClick = async () => {
    const list: Array<Promise<unknown>> = [];
    currentProjectList.value?.forEach((projectInfo) => {
        list.push(electronExpose.git.pull({ cwd: projectInfo.path }));
    });

    Loading.show({ message: '批量更新代码中' });
    try {
        const pullData = (await Promise.all(list)) as Array<{ success: boolean; cwd: string; data: unknown }>;
        const wrongList: string[] = [];
        pullData.forEach((res, index) => {
            if (!res.success && currentProjectList.value?.[index]) {
                wrongList.push(currentProjectList.value?.[index].projectName);
            }
        });
        if (wrongList.length) {
            toast.show(`批量更新代码失败[ ${wrongList.toString()} ]`, 'error');
        } else {
            toast.show('批量更新代码成功', 'done');
        }
    } catch (error) {
        toast.show('批量更新代码失败', 'error');
    } finally {
        Loading.hide();
    }
};
</script>
<style scoped lang="scss">
.project-header {
    display: flex;
    align-items: center;

    .tools-btn {
        margin-left: 12px;
        padding: 4px 12px;
        min-height: unset;
    }
}
</style>
