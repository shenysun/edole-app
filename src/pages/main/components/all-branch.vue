<template>
    <q-select
        v-if="branchInfo"
        :model-value="props.autoCheckBranch ? branchInfo.current : props.select"
        @update:model-value="onValueChange"
        class="project-actions-select"
        filled
        @filter="(_input, doneFn) => getBranches(doneFn)"
        :options="branchInfo.all"
        menu-self="top middle"
        menu-anchor="bottom middle"
    ></q-select>
</template>

<!-- 所有分支 -->
<script lang="ts" setup>
import { QSelect } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { computed, watch } from 'vue';
import { ProjectInfo } from '../meta';

interface Props {
    projectInfo: ProjectInfo;
    autoCheckBranch?: boolean; // 自动checkout
    select?: string; // 如果 autoCheckBranch 为false 则使用select并且不改变current
}

const props = withDefaults(defineProps<Props>(), {
    autoCheckBranch: true,
});
const emit = defineEmits(['update:select']);
const cwd = computed(() => props.projectInfo.path);
const projectName = computed(() => props.projectInfo.projectName);
const store = useProjectStore();
const branchInfo = computed(() => store.getBranchInfo(projectName.value));

/**
 * 获取所有分支
 * @param doneFn
 */
const getBranches = async (doneFn?: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void) => {
    const info = await electronExpose.shell.git({ command: 'branch', cwd: cwd.value });
    if (doneFn) {
        doneFn(() => {
            store.setBranchInfo(projectName.value, info);
        });
    } else {
        store.setBranchInfo(projectName.value, info);
    }
};

/**
 * 切换分支
 * @param branch
 */
const checkoutBranch = async (branch: string) => {
    await electronExpose.shell.git({ command: 'checkout', branch, cwd: cwd.value });
    await getBranches();
    toast.show(`切换分支${branch}成功`, 'done');
};

const onValueChange = (val: string) => {
    if (props.autoCheckBranch) {
        branchInfo.value && (branchInfo.value.current = val);
    } else {
        emit('update:select', val);
    }
};

watch(
    () => branchInfo.value?.current,
    (val, pre) => {
        if (!pre || !val) {
            return;
        }

        if (val.startsWith('remotes/origin/')) {
            val = val.split('remotes/origin/')[1];
        }
        checkoutBranch(val);
    }
);
</script>
<style scoped></style>
