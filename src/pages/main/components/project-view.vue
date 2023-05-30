<template>
    <div class="project-view">
        <div class="project-item-wrapper">
            <template v-if="currentProjectList?.length">
                <project-item
                    v-for="info in currentProjectList"
                    :key="info.projectName"
                    @delete="onDeleteItem"
                    @create-branch="onShowCreateBranch"
                    @merge-branch="onShowMergeBranch"
                    :project-info="info"
                ></project-item>
            </template>
            <div v-else class="none-peoject absolute-center">空空如也，快去添加项目吧！</div>
        </div>

        <q-dialog v-model="newBranchInfo.show" persistent>
            <new-branch
                v-if="newBranchInfo.info"
                @update:show="(val) => (newBranchInfo.show = val)"
                :project-info="newBranchInfo.info"
            />
        </q-dialog>
        <q-dialog v-model="mergeBranchInfo.show" persistent>
            <merge-branch
                v-if="mergeBranchInfo.info"
                @update:show="(val) => (mergeBranchInfo.show = val)"
                :project-info="mergeBranchInfo.info"
            />
        </q-dialog>
    </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { ProjectInfo } from '../meta';
import ProjectItem from './project-item.vue';
import { QDialog, QSeparator } from 'quasar';
import { useProjectStore } from 'src/stores/project';
import { storeToRefs } from 'pinia';
import { useGroupStore } from 'src/stores/group';
import NewBranch from './new-branch.vue';
import MergeBranch from './merge-branch.vue';

const store = useProjectStore();
const groupStore = useGroupStore();
const { currentProjectList } = storeToRefs(groupStore);
const newBranchInfo = reactive<{ show: boolean; info?: ProjectInfo }>({ show: false });
const mergeBranchInfo = reactive<{ show: boolean; info?: ProjectInfo }>({ show: false });

const onDeleteItem = (info: ProjectInfo) => {
    groupStore.removeGroupProject(info);
    store.setBranchInfo(info.projectName);
    store.setScripts(info.projectName);
};

const onShowCreateBranch = (info: ProjectInfo) => {
    newBranchInfo.info = info;
    newBranchInfo.show = true;
};

const onShowMergeBranch = (info: ProjectInfo) => {
    mergeBranchInfo.info = info;
    mergeBranchInfo.show = true;
};
</script>
<style lang="scss" scoped>
.project-view {
    display: flex;
    flex-direction: column;
    padding: 30px 20px 0;

    .project-item-wrapper {
        position: relative;
        padding-right: 20px;
        height: 100%;
        overflow: auto;
    }
}
</style>
