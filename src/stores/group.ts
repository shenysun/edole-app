import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { GroupInfo, ProjectInfo } from 'src/pages/main/meta';
import { computed, ref, watch } from 'vue';

const groupInfoKey = 'groupInfo';
const selectGroupKey = 'selectGroup';
export const useGroupStore = defineStore('group', () => {
    const groupList = useLocalStorage<GroupInfo[]>(groupInfoKey, ref([]));
    const selectGroup = useLocalStorage(selectGroupKey, ref(''));
    const groupNameList = computed(() => groupList.value.map((info) => info.groupName));
    const currentGroup = computed(() => groupList.value.find((g) => g.groupName === selectGroup.value));
    const currentProjectList = computed(() => currentGroup.value?.projects);

    const addGroup = (groupName: string) => {
        const has = groupList.value.find((info) => {
            return info.groupName === groupName;
        });

        if (has) {
            return;
        }

        groupList.value.push({
            groupName,
            projects: [],
        });
    };

    const removeGroup = (groupName: string) => {
        const index = groupList.value.findIndex((info) => {
            return info.groupName === groupName;
        });

        if (selectGroup.value === groupName) {
            selectGroup.value = '';
        }

        if (index > -1) {
            groupList.value.splice(index, 1);
        }
    };

    const updateGroup = (groupName: string, newGroupName: string) => {
        const index = groupList.value.findIndex((info) => {
            return info.groupName === groupName;
        });

        if (index > -1) {
            selectGroup.value = newGroupName;
            groupList.value[index].groupName = newGroupName;
        }
    };

    const addGroupProject = (info: ProjectInfo) => {
        if (!currentGroup.value) {
            return;
        }

        const has = currentGroup.value.projects.find((item) => item.path === info.path);
        if (has) {
            return false;
        }
        currentGroup.value.projects.push(info);
    };

    const removeGroupProject = (info: ProjectInfo) => {
        if (!currentGroup.value) {
            return;
        }

        const itemIndex = currentGroup.value.projects.findIndex((item) => item.path === info.path);
        currentGroup.value.projects.splice(itemIndex, 1);
    };

    const getProjectCwd = (projectName: string) => {
        return currentProjectList.value?.find((info) => info.projectName === projectName)?.path;
    };

    watch(
        groupNameList,
        (list) => {
            if (!selectGroup.value) {
                selectGroup.value = list[0];
            }

            if (!list.length) {
                selectGroup.value = '';
            }
        },
        {
            immediate: true,
        }
    );
    return {
        groupList,
        groupNameList,
        selectGroup,
        currentGroup,
        currentProjectList,
        addGroup,
        removeGroup,
        updateGroup,
        addGroupProject,
        removeGroupProject,
        getProjectCwd,
    };
});
