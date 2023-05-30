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
            <all-branch v-model:select="startPointBranch" :project-info="props.projectInfo!"></all-branch>
        </q-card-section>
        <q-card-section class="q-pt-none">
            <q-checkbox v-model="createRemote" label="提交到远端" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
            <q-btn flat label="取消" v-close-popup />
            <q-btn flat label="创建分支" @click="onCreateClick" />
        </q-card-actions>
    </q-card>
</template>

<script lang="ts" setup>
import { Loading } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectItem } from 'src/composable/useProjectItem';
import { ref } from 'vue';
import { ProjectInfo } from '../meta';
import AllBranch from './all-branch.vue';

interface Props {
    projectInfo: ProjectInfo;
}

const emit = defineEmits(['update:show']);
const props = defineProps<Props>();
const { cwd, updateBranches } = useProjectItem(props.projectInfo);
const branchName = ref('');
const startPointBranch = ref('');
const createRemote = ref(false);

const onCreateClick = async () => {
    if (!branchName.value) {
        toast.show('请输入分支名称', 'error');
        return;
    }

    let val = startPointBranch.value;
    if (val.startsWith('remotes/')) {
        val = val.split('remotes/')[1];
    }

    Loading.show({ message: '创建分支中...' });
    // 创建分支
    await electronExpose.shell.git({
        command: createRemote.value ? 'checkoutRemoteBranch' : 'checkoutBranch',
        branch: branchName.value,
        startPoint: val,
        cwd: cwd.value || '',
    });
    Loading.hide();
    emit('update:show', false);
    toast.show(`创建分支${branchName.value}成功`, 'done');
    updateBranches();
};
</script>
<style scoped></style>
