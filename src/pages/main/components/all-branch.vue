<template>
    <q-select
        class="all-branch-select"
        v-if="branchInfo"
        :model-value="realSelect"
        :options="branchInfo.all"
        :multiple="multiple"
        filled
        @update:model-value="onSelectChange"
        @filter="(_input, doneFn) => updateBranches(doneFn)"
    ></q-select>
</template>

<!-- 所有分支 -->
<script lang="ts" setup>
import { QSelect } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { remoteBranchToLocal } from 'src/common/utils/branch';
import { useProjectItem } from 'src/composable/useProjectItem';
import { useProjectStore } from 'src/stores/project';
import { computed, nextTick, ref, watch } from 'vue';
import { ProjectInfo } from '../meta';

type MyBeArrayString = string | string[];
interface Props {
    projectInfo: ProjectInfo;
    select?: MyBeArrayString;
    multiple?: boolean;
    autoCheckBranch?: boolean; // 自动checkout branch
}

const props = defineProps<Props>();
const emit = defineEmits(['update:select']);
const { cwd, projectName, updateBranches } = useProjectItem(props.projectInfo);
const store = useProjectStore();
const branchInfo = computed(() => store.getBranchInfo(projectName.value));
const realSelect = ref(props.select || (props.multiple ? [] : ''));

const hasSelect = computed(() => {
    return props.multiple && Array.isArray(props.select) ? props.select.length > 0 : !!props.select;
});

const emitSelect = (val: unknown) => {
    let result = val;
    if (props.multiple) {
        result = Array.isArray(val) ? val : [val];
    } else {
        result = Array.isArray(val) ? val[0] : val;
    }

    realSelect.value = result as MyBeArrayString;
    return emit('update:select', result);
};

const onSelectChange = (val: unknown) => {
    emitSelect(val);
};

/**
 * watch once current branch
 */
const cancel = watch(
    () => branchInfo.value?.current,
    (val) => {
        if (hasSelect.value) {
            nextTick(() => cancel());
            return;
        }

        emitSelect(val);
    },
    {
        immediate: true,
    }
);

/**
 * 切换分支
 * @param branch
 */
const checkoutBranch = async (branch: string) => {
    try {
        await electronExpose.shell.git({ command: 'checkout', branch, cwd: cwd.value });
        await updateBranches();
        branchInfo.value && (branchInfo.value.current = branch);
        toast.show(`切换分支${branch}成功`, 'done');
    } catch (error) {
        console.log('切换分支错误', error);
        toast.show(`切换分支${branch}失败 ${error}`, 'error');
    }
};

watch(realSelect, (val, pre) => {
    if (!props.autoCheckBranch) {
        return;
    }

    if (props.multiple || Array.isArray(val)) {
        return;
    }

    if (!pre || !val) {
        return;
    }

    val = remoteBranchToLocal(val);
    checkoutBranch(val);
});
</script>
<style scoped>
.all-branch-select {
    width: 350px;
}
</style>
