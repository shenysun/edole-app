<template>
    <div class="project-view">
        <header class="project-header">
            <span class="project-title">项目</span>
            <q-btn class="project-add" color="teal" label="添加项目" @click="onAddClick"></q-btn>
            <q-btn class="project-script" color="red-6" label="批量执行脚本" @click="showScripts = true"></q-btn>
        </header>
        <q-separator style="margin: 20px 0"></q-separator>
        <div class="project-item-wrapper">
            <template v-if="currentProjectList?.length">
                <project-item
                    v-for="info in currentProjectList"
                    :key="info.projectName"
                    @delete="onDeleteItem"
                    :info="info"
                ></project-item>
            </template>
            <div v-else class="none-peoject absolute-center">空空如也，快去添加项目吧！</div>
        </div>

        <q-dialog v-model="showScripts">
            <batch-scripts></batch-scripts>
        </q-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ProjectInfo } from '../meta';
import ProjectItem from './project-item.vue';
import { QBtn, QDialog, QSeparator } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { storeToRefs } from 'pinia';
import { useGroupStore } from 'src/stores/group';
import BatchScripts from './batch-scripts.vue';

const store = useProjectStore();
const groupStore = useGroupStore();
const { currentProjectList, selectGroup } = storeToRefs(groupStore);
const showScripts = ref(false);

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

const onDeleteItem = (info: ProjectInfo) => {
    groupStore.removeGroupProject(info);
    store.setBranchInfo(info.projectName);
    store.setScripts(info.projectName);
};
</script>
<style lang="scss" scoped>
.project-view {
    display: flex;
    flex-direction: column;
    padding: 30px 20px 0;
    .project-header {
        display: flex;
        align-items: center;

        .project-title {
            font-size: 28px;
        }

        .project-add {
            margin-left: auto;
        }

        .project-script {
            margin-left: 12px;
        }
    }

    .project-item-wrapper {
        position: relative;
        padding-right: 20px;
        height: 100%;
        overflow: auto;
    }
}
</style>
