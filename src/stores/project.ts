import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { remoteBranchToLocal, remoteReg } from 'src/common/utils/branch';
import { ProjectBranchInfo } from 'src/pages/main/meta';
import { computed, reactive, Ref, ref, unref } from 'vue';

const scriptLatestKey = 'scriptLatest';
export const useProjectStore = defineStore('project', () => {
    const scriptLatest = useLocalStorage<Record<string, string>>(scriptLatestKey, ref({}));
    const branchInfoMap = reactive<Map<string, ProjectBranchInfo>>(new Map());
    const scriptsMap = reactive<Map<string, string[]>>(new Map());

    const setBranchInfo = (projectName: string | Ref<string>, info?: ProjectBranchInfo) => {
        const key = unref(projectName);
        if (!info) {
            branchInfoMap.delete(key);
            return;
        }

        const all = new Set<string>();
        info.all.forEach((item) => {
            info.branches[item].isRemote = remoteReg.test(item);
            all.add(remoteBranchToLocal(item));
        });

        info.all = Array.from(all);
        branchInfoMap.set(key, info);
    };

    const setScripts = (projectName: string | Ref<string>, scripts?: string[]) => {
        const key = unref(projectName);
        if (!scripts) {
            scriptsMap.delete(key);
            return;
        }
        scriptsMap.set(key, scripts);
    };

    const setScriptLatest = (projectName: string | Ref<string>, script: string) => {
        const key = unref(projectName);
        scriptLatest.value[key] = script;
    };

    const getBranchInfo = computed(() => {
        return (projectName: string) => {
            return branchInfoMap.get(projectName);
        };
    });

    const getScripts = computed(() => {
        return (projectName: string) => {
            return scriptsMap.get(projectName) || [];
        };
    });

    return {
        scriptsMap,
        scriptLatest,
        getBranchInfo,
        getScripts,
        setBranchInfo,
        setScripts,
        setScriptLatest,
    };
});
