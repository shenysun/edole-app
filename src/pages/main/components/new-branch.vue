<template>
    <q-card style="min-width: 350px" @keyup.enter="onCreateClick">
        <q-card-section>
            <div class="text-h6">创建分支</div>
            <div class="text-h8">请输入分支名称</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
            <q-input dense v-model="branchName" autofocus />
        </q-card-section>

        <q-card-section class="q-pt-none">
            <div class="text-h8">新分支基于（git checkout -b branch 'start-point'）</div>
            <all-branch
                v-model:select="startPointBranch"
                :auto-check-branch="false"
                :project-info="props.projectInfo!"
            ></all-branch>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
            <q-btn flat label="取消" v-close-popup />
            <q-btn flat label="创建分支" @click="onCreateClick" />
        </q-card-actions>
    </q-card>
</template>

<script lang="ts" setup>
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectItem } from 'src/composable/useProjectItem';
import { useProjectStore } from 'src/stores/project';
import { computed, ref } from 'vue';
import { ProjectInfo } from '../meta';
import AllBranch from './all-branch.vue';

interface Props {
    projectInfo: ProjectInfo;
}

const emit = defineEmits(['update:show']);
const props = defineProps<Props>();
const store = useProjectStore();
const branchInfo = computed(() => store.getBranchInfo(props.projectInfo?.projectName || ''));
const { cwd, updateBranches } = useProjectItem(props.projectInfo);
const branchName = ref('');
const startPointBranch = ref(branchInfo.value?.current || '');

const onCreateClick = async () => {
    if (!branchName.value) {
        toast.show('请输入分支名称', 'error');
        return;
    }

    let val = startPointBranch.value;
    if (val.startsWith('remotes/')) {
        val = val.split('remotes/')[1];
    }
    // 创建分支
    await electronExpose.shell.git({
        command: 'checkoutBranch',
        branch: branchName.value,
        startPoint: val,
        cwd: cwd.value || '',
    });
    emit('update:show', false);
    toast.show(`创建分支${branchName.value}成功`, 'done');
    updateBranches();
};
</script>
<style scoped></style>
