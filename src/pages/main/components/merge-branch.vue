<template>
    <q-card style="min-width: 350px" @keyup.enter="onMergeClick">
        <q-card-section>
            <div class="text-h6">合并</div>
            <div class="text-h8" style="margin-top: 10px">将这些分支</div>
            <all-branch :project-info="props.projectInfo!" v-model:select="fromBranchList" multiple />
        </q-card-section>
        <q-card-section class="q-pt-none">
            <div class="text-h8">合并到</div>
            <all-branch v-model:select="toBranchName" :project-info="props.projectInfo!"></all-branch>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
            <q-btn flat label="取消" v-close-popup />
            <q-btn flat label="合并分支" @click="onMergeClick" />
        </q-card-actions>
    </q-card>
</template>

<script lang="ts" setup>
import { Loading } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { remoteBranchToLocal } from 'src/common/utils/branch';
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
const toBranchName = ref('');
const fromBranchList = ref([]);

const onMergeClick = async () => {
    const mergeFrom = fromBranchList.value.filter((t) => t).map((t) => remoteBranchToLocal(t));
    try {
        Loading.show();
        await electronExpose.git.merge({ cwd: cwd.value, mergeFrom, branch: toBranchName.value });
        updateBranches();
        emit('update:show', false);
        toast.show('合并分支成功', 'done');
    } catch (error) {
        toast.show('合并分支失败' + error, 'error');
        console.log('合并分支错误', error);
    } finally {
        Loading.hide();
    }
};
</script>
<style scoped lang="scss">
.input-new {
    height: 56px;
}
</style>
