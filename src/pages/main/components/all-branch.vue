<template>
    <q-select
        v-if="branchInfo"
        :model-value="props.autoCheckBranch ? branchInfo.current : props.select"
        @update:model-value="onValueChange"
        class="project-actions-select"
        filled
        @filter="(_input, doneFn) => updateBranches(doneFn)"
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
import { useProjectItem } from 'src/composable/useProjectItem';
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
const { cwd, projectName, updateBranches } = useProjectItem(props.projectInfo);
const store = useProjectStore();
const branchInfo = computed(() => store.getBranchInfo(projectName.value));

/**
 * 切换分支
 * @param branch
 */
const checkoutBranch = async (branch: string) => {
    await electronExpose.shell.git({ command: 'checkout', branch, cwd: cwd.value });
    await updateBranches();
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
