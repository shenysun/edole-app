import { QSelect } from 'quasar';
import { electronExpose } from 'src/common/expose';
import { ProjectInfo } from 'src/pages/main/meta';
import { useProjectStore } from 'src/stores/project';
import { computed } from 'vue';

export function useProjectItem(projectInfo: ProjectInfo) {
    const cwd = computed(() => projectInfo.path);
    const projectName = computed(() => projectInfo.projectName);
    const projectStore = useProjectStore();

    /**
     * 更新分支
     * @param doneFn
     */
    const updateBranches = async (doneFn?: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void) => {
        const info = await electronExpose.shell.git({ command: 'branch', cwd: cwd.value });
        const setStore = () => {
            projectStore.setBranchInfo(projectName.value, info);
        };
        if (doneFn) {
            doneFn(setStore);
        } else {
            setStore();
        }
    };

    return {
        cwd,
        projectName,
        updateBranches,
    };
}
