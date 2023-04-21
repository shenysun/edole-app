import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { BranchInfo } from 'src/pages/main/meta';
import { computed, reactive, Ref, ref, unref } from 'vue';

const scriptLatestKey = 'scriptLatest';
export const useProjectStore = defineStore('project', () => {
    const scriptLatest = useLocalStorage<Record<string, string>>(scriptLatestKey, ref({}));
    const branchInfoMap = reactive<Map<string, BranchInfo>>(new Map());
    const scriptsMap = reactive<Map<string, string[]>>(new Map());

    const setBranchInfo = (projectName: string | Ref<string>, info?: BranchInfo) => {
        const key = unref(projectName);
        if (!info) {
            branchInfoMap.delete(key);
            return;
        }
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
