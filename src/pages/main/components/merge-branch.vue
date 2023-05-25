<template>
    <q-card style="min-width: 350px" @keyup.enter="onMergeClick">
        <q-card-section>
            <div class="text-h6">合并</div>
            <div class="text-h8" style="margin-top: 10px">将这些分支</div>
            <all-branch
                v-for="(t, index) in fromCount"
                :key="t"
                :annnnnnn="t"
                v-model:select="fromBranchList[index]"
                :auto-check-branch="false"
                :project-info="props.projectInfo!"
            ></all-branch>
            <q-btn-group push>
                <q-btn
                    @click="onCountChange(1)"
                    style="margin-left: auto"
                    size="xs"
                    flat
                    round
                    color="primary"
                    icon="add"
                />
                <q-btn @click="onCountChange(-1)" size="xs" flat round color="primary" icon="remove" />
            </q-btn-group>
        </q-card-section>

        <q-card-section class="q-pt-none">
            <div class="text-h8">合并到</div>
            <q-input
                class="input-new"
                v-if="isNewBranch"
                dense
                v-model="toBranchName"
                autofocus
                placeholder="输入新的分支名"
            />
            <all-branch
                v-else
                v-model:select="toBranchName"
                :auto-check-branch="false"
                :project-info="props.projectInfo!"
            ></all-branch>
        </q-card-section>

        <q-card-actions align="right">
            <q-toggle v-model="isNewBranch" label="合并到新分支" />
        </q-card-actions>
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
import { reactive, ref, watch, watchEffect } from 'vue';
import { ProjectInfo } from '../meta';
import AllBranch from './all-branch.vue';

interface Props {
    projectInfo: ProjectInfo;
}

const emit = defineEmits(['update:show']);
const props = defineProps<Props>();
const { cwd, updateBranches } = useProjectItem(props.projectInfo);
const isNewBranch = ref(false);
const toBranchName = ref('');
const fromCount = ref(1);
const fromBranchList = ref(['']);

const onMergeClick = async () => {
    console.log('onCreateClick');
    const mergeFrom = fromBranchList.value.filter((t) => t).map((t) => remoteBranchToLocal(t));
    try {
        Loading.show();
        await electronExpose.shell.git({ command: 'merge', cwd: cwd.value, mergeFrom, branch: toBranchName.value });
        updateBranches();
        emit('update:show', false);
    } catch (error) {
        console.log('合并分支错误', error);
    } finally {
        Loading.hide();
    }
};

const onCountChange = (count: number) => {
    const target = fromCount.value + count;
    if (target < 1) {
        return toast.show('至少有一个分支', 'error');
    }
    fromCount.value = Math.max(1, fromCount.value + count);
};

watchEffect(() => {
    fromBranchList.value = new Array(fromCount.value).fill('').map((t, i) => {
        return fromBranchList.value[i] || '';
    });
});
</script>
<style scoped lang="scss">
.input-new {
    height: 56px;
}
</style>
