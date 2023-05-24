<template>
    <q-card class="batch-dialog">
        <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">批量{{ props.type === 'script' ? '执行脚本' : '创建分支' }}</div>
            <q-space />
            <q-btn-dropdown outline auto-close label="一键配置" v-if="props.type === 'script'">
                <q-list>
                    <q-item clickable @click="onAutoPackClick('test')">
                        <q-item-section>
                            <q-item-label>测试环境</q-item-label>
                        </q-item-section>
                    </q-item>
                    <q-item clickable @click="onAutoPackClick('prod')">
                        <q-item-section>
                            <q-item-label>生产环境</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>
            <q-input
                v-else-if="props.type === 'branch'"
                dense
                v-model="uniteInput"
                placeholder="输入新的分支名"
                autofocus
            />
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="dialog-content dialog-content-script" v-if="props.type === 'script'">
            <div v-for="info in currentProjectList" :key="info.projectName" class="dialog-content-item">
                <span class="dialog-project-name">{{ info.projectName }}</span>
                <q-select
                    v-model="scriptSelectInfo[info.projectName]"
                    class="dialog-project-scripts"
                    filled
                    :options="scriptOptions(info.projectName)"
                ></q-select>
            </div>
        </q-card-section>
        <q-card-section class="dialog-content dialog-content-branch" v-else-if="props.type === 'branch'">
            <div v-for="info in currentProjectList" :key="info.projectName" class="dialog-content-item">
                <span class="dialog-project-name">{{ info.projectName }}</span>
                <span>新分支</span>
                <q-input dense v-model="branchInputInfo[info.projectName]" placeholder="输入新的分支名" autofocus />
                <span>基于</span>
                <all-branch
                    class="dialog-project-branch"
                    :project-info="info"
                    v-model:select="branchSelectInfo[info.projectName]"
                    :auto-check-branch="false"
                />
            </div>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section class="dialog-actions">
            <q-btn color="secondary" label="批量执行" @click="onBatchActionClick"></q-btn>
        </q-card-section>
    </q-card>
</template>

<script lang="ts" setup>
import { Loading, QBtn, QBtnDropdown, QCard, QCardSection, QSelect, QSeparator, QSpace } from 'quasar';
import { storeToRefs } from 'pinia';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { getBuildCommand, noneScript } from 'src/common/utils/build-command';
import { useGroupStore } from 'src/stores/group';
import { useOSStore } from 'src/stores/os';
import { useProjectStore } from 'src/stores/project';
import { computed, reactive, ref, watch } from 'vue';
import { BuildEnv } from '../meta';
import AllBranch from './all-branch.vue';

interface Props {
    type: 'branch' | 'script' | '';
}
const props = defineProps<Props>();
const os = useOSStore();
const groupStore = useGroupStore();
const projectStore = useProjectStore();
const { currentProjectList } = storeToRefs(groupStore);
const { scriptsMap, scriptLatest } = storeToRefs(projectStore);
const uniteInput = ref('');
const scriptSelectInfo = reactive<Record<string, string>>({});
const branchSelectInfo = reactive<Record<string, string>>({});
const branchInputInfo = reactive<Record<string, string>>({});

const scriptOptions = computed(() => {
    return (projectName: string) => {
        return [noneScript, ...(scriptsMap.value.get(projectName) || [])];
    };
});

const onAutoPackClick = (type: BuildEnv) => {
    const projectNames = Object.keys(scriptSelectInfo);
    projectNames.forEach((projectName) => {
        const command = getBuildCommand(projectName, type, os.platform);
        scriptSelectInfo[projectName] = command;
    });
};

const batchBranch = async () => {
    const projectNames = Object.keys(branchInputInfo);
    const list: Array<Promise<unknown>> = [];
    projectNames.forEach((projectName) => {
        const cwd = groupStore.getProjectCwd(projectName);
        if (cwd) {
            const branch = branchInputInfo[projectName];
            if (branch) {
                list.push(
                    electronExpose.shell.git({
                        command: 'checkoutBranch',
                        branch,
                        startPoint: branchSelectInfo[projectName],
                        cwd,
                    })
                );
            }
        }
    });

    Loading.show({
        message: '批量创建分支中',
    });

    try {
        await Promise.all(list);
        toast.show('批量创建分支完毕', 'done');
    } catch (error) {
        toast.show('批量创建分支有错误', 'error');
    } finally {
        Loading.hide();
        updateProjectBranch();
    }
};

const batchScript = async () => {
    const projectNames = Object.keys(scriptSelectInfo);
    const list: Array<{ cwd: string; command: string }> = [];
    projectNames.forEach((projectName) => {
        const cwd = groupStore.getProjectCwd(projectName);
        if (cwd) {
            const command = scriptSelectInfo[projectName];
            if (command) {
                projectStore.setScriptLatest(projectName, command);
                command !== noneScript &&
                    list.push({
                        cwd,
                        command,
                    });
            }
        }
    });

    Loading.show({
        message: '批量执行脚本中',
    });

    try {
        await electronExpose.shell.batchScript(list);
        toast.show('批量脚本执行完毕', 'done');
    } catch (error) {
        toast.show('批量脚本执行有错误', 'error');
    } finally {
        Loading.hide();
    }
};

const updateProjectBranch = async () => {
    currentProjectList.value?.forEach((projectInfo) => {
        const { projectName, path } = projectInfo;
        electronExpose.shell.git({ command: 'branch', cwd: path }).then((info) => {
            projectStore.setBranchInfo(projectName, info);
        });
    });
};

const onBatchActionClick = () => {
    switch (props.type) {
        case 'script':
            batchScript();
            break;
        case 'branch':
            batchBranch();
            break;

        default:
            break;
    }
};

watch(
    scriptLatest,
    (val) => {
        if (!currentProjectList.value) {
            return;
        }

        const temp: Record<string, string> = {};
        for (const info of currentProjectList.value) {
            temp[info.projectName] = noneScript;
        }
        Object.assign(scriptSelectInfo, temp, val);
    },
    {
        immediate: true,
    }
);

watch(uniteInput, (val) => {
    if (!currentProjectList.value) {
        return;
    }

    for (const info of currentProjectList.value) {
        branchInputInfo[info.projectName] = val;
    }
});
</script>
<style lang="scss" scoped>
.batch-dialog {
    min-width: 560px;
    max-width: 100%;
}
.dialog-content {
    height: 70vh;
    overflow: auto;

    &.dialog-content-branch .dialog-content-item {
        span {
            white-space: nowrap;
            margin-right: 40px;
        }
    }

    .dialog-content-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .dialog-project-name {
            text-align: left;
            flex: 0 0 250px;
            margin-right: 40px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dialog-project-branch,
        .dialog-project-scripts {
            width: 250px;
            :deep(.q-field__inner) {
                .q-field__marginal {
                    height: 40px;
                }

                .q-field__control,
                .q-field__native {
                    min-height: 40px;
                }
            }
        }
    }
}

.dialog-actions {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
