<template>
    <q-card class="batch-dialog">
        <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">批量{{ title }}</div>
            <q-space />
            <q-btn-dropdown outline auto-close label="一键配置" v-if="props.type === 'script'">
                <q-list>
                    <template v-for="item in quickConfigMap" :key="item.type">
                        <q-item clickable @click="onAutoPackClick(item.type)">
                            <q-item-section>
                                <q-item-label>{{ item.label }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
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
            <q-item v-for="info in currentProjectList" :key="info.projectName" class="dialog-content-item">
                <span class="dialog-project-name">{{ info.projectName }}</span>
                <q-select
                    v-model="scriptSelectInfo[info.projectName]"
                    class="dialog-project-scripts"
                    filled
                    :options="scriptOptions(info.projectName)"
                    :disable="isScriptExecuting"
                ></q-select>
                <div class="project-status">
                    <span>执行状态：</span>
                    <span :style="'color: ' + execStatusToColor(scriptExecInfo[info.projectName]) + ';'">{{
                        execStatusToCN(scriptExecInfo[info.projectName])
                    }}</span>
                    <!-- <q-icon :name="execStatusToIcon(scriptExecInfo[info.projectName])"></q-icon> -->
                </div>
            </q-item>
        </q-card-section>
        <q-card-section class="dialog-content dialog-content-branch" v-else-if="props.type === 'branch'">
            <q-item v-for="info in currentProjectList" :key="info.projectName" class="dialog-content-item">
                <span class="dialog-project-name">{{ info.projectName }}</span>
                <span>新分支</span>
                <q-input dense v-model="branchInputInfo[info.projectName]" placeholder="输入新的分支名" autofocus />
                <span>基于</span>
                <all-branch
                    class="dialog-project-branch"
                    :project-info="info"
                    v-model:select="branchSelectInfo[info.projectName]"
                />
            </q-item>
        </q-card-section>
        <q-card-section class="dialog-content dialog-content-merge" v-else-if="props.type === 'merge'">
            <q-item v-for="info in currentProjectList" :key="info.projectName" class="dialog-content-item">
                <span class="dialog-project-name">{{ info.projectName }}</span>
                <span>将</span>
                <all-branch
                    class="dialog-project-branch"
                    :project-info="info"
                    v-model:select="mergeFromInfo[info.projectName]"
                    multiple
                />
                <span>合并到</span>
                <all-branch
                    class="dialog-project-branch"
                    :project-info="info"
                    v-model:select="mergeToInfo[info.projectName]"
                />
            </q-item>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section class="dialog-actions">
            <q-btn color="secondary" label="批量执行" @click="onBatchActionClick"></q-btn>
        </q-card-section>
    </q-card>
</template>

<script lang="ts" setup>
import { Dialog, Loading, QBtn, QBtnDropdown, QCard, QCardSection, QSelect, QSeparator, QSpace } from 'quasar';
import { storeToRefs } from 'pinia';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { getBuildCommand, noneScript } from 'src/common/utils/build-command';
import { useGroupStore } from 'src/stores/group';
import { useOSStore } from 'src/stores/os';
import { useProjectStore } from 'src/stores/project';
import { computed, reactive, ref, watch, watchEffect } from 'vue';
import { BatchType, BuildEnv, ExecStatus } from '../meta';
import AllBranch from './all-branch.vue';
import { remoteBranchToLocal } from 'src/common/utils/branch';

interface Props {
    type: BatchType;
}
const props = defineProps<Props>();
const os = useOSStore();
const groupStore = useGroupStore();
const projectStore = useProjectStore();
const { currentProjectList } = storeToRefs(groupStore);
const { scriptsMap, scriptLatest } = storeToRefs(projectStore);
// 一键配置源数据
const quickConfigMap = ref<{ type: BuildEnv; label: string }[]>([
    { type: 'test:ld', label: '乐读--测试环境' },
    { type: 'prod:ld', label: '乐读--生产环境' },
    { type: 'test:sy', label: '素养--测试环境' },
    { type: 'prod:sy', label: '素养--生产环境' },
]);
const uniteInput = ref('');
const isScriptExecuting = ref(false);
// 执行脚本相关
const scriptSelectInfo = reactive<Record<string, string>>({});
const scriptExecInfo = reactive<Record<string, ExecStatus>>({});
// 创建分支相关
const branchSelectInfo = reactive<Record<string, string>>({});
const branchInputInfo = reactive<Record<string, string>>({});
// 合并分支相关
const mergeFromInfo = reactive<Record<string, string[]>>({});
const mergeToInfo = reactive<Record<string, string>>({});

const scriptOptions = computed(() => {
    return (projectName: string) => {
        return [noneScript, ...(scriptsMap.value.get(projectName) || [])];
    };
});

const title = computed(() => {
    switch (props.type) {
        case 'script':
            return '批量执行脚本';
        case 'branch':
            return '批量切换分支';
        case 'merge':
            return '批量合并分支';
        default:
            return '错误打开';
    }
});

const onAutoPackClick = (type: BuildEnv) => {
    const projectNames = Object.keys(scriptSelectInfo);
    projectNames.forEach((projectName) => {
        const command = getBuildCommand(projectName, type, os.platform);
        scriptSelectInfo[projectName] = command;
    });
};

const batchMerge = async () => {
    const mergeInfoList = Object.entries(mergeFromInfo)
        .map(([projectName, fromBranchList]) => {
            const toBranchName = mergeToInfo[projectName];
            const cwd = groupStore.getProjectCwd(projectName);
            if (cwd && toBranchName) {
                const mergeFrom = fromBranchList.filter((t) => t).map((t) => remoteBranchToLocal(t));
                return { cwd, mergeFrom, branch: toBranchName };
            }
        })
        .filter((t) => t);

    if (mergeInfoList.length) {
        async function mergeFn() {
            try {
                Loading.show();
                const promiseList: Array<Promise<unknown>> = [];
                for (const mergeInfo of mergeInfoList) {
                    if (mergeInfo) {
                        const { cwd, mergeFrom, branch } = mergeInfo;
                        promiseList.push(electronExpose.shell.git({ command: 'merge', cwd, mergeFrom, branch }));
                    }
                }
                await Promise.allSettled(promiseList);
                toast.show('合并分支成功', 'done');
            } catch (error) {
                console.log('合并分支错误', error);
            } finally {
                Loading.hide();
            }
        }

        Dialog.create({
            title: '确认',
            html: true,
            message: `<pre>${mergeInfoList
                .map((t) => `将${t?.mergeFrom.join(' ')} 合并到${t?.branch};`)
                .join('\n')}</pre>`,
            ok: '确认',
            cancel: '取消',
        }).onOk(() => {
            console.log(`${mergeInfoList.map((t) => `将${t?.mergeFrom.join(' ')} 合并到${t?.branch}`).join('\n')};`);
            mergeFn();
        });
    }
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
    isScriptExecuting.value = true;
    function dealPromise(name: string, p: Promise<unknown>) {
        scriptExecInfo[name] = 'start';
        p.then(() => {
            scriptExecInfo[name] = 'success';
        }).catch(() => {
            scriptExecInfo[name] = 'error';
        });
    }
    const projectNames = Object.keys(scriptSelectInfo);
    const scrPromiseList: Promise<unknown>[] = [];
    projectNames.forEach((projectName) => {
        const cwd = groupStore.getProjectCwd(projectName);
        if (cwd) {
            const command = scriptSelectInfo[projectName];
            if (command) {
                projectStore.setScriptLatest(projectName, command);
                if (command !== noneScript) {
                    const p = electronExpose.shell.script({ command, cwd });
                    dealPromise(projectName, p);
                    scrPromiseList.push(p);
                }
            }
        }
    });

    Loading.show({
        message: '批量执行脚本中',
    });

    try {
        await Promise.allSettled(scrPromiseList);
        toast.show('批量脚本执行完毕', 'done');
    } finally {
        Loading.hide();
        isScriptExecuting.value = false;
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
        case 'merge':
            batchMerge();
            break;

        default:
            break;
    }
};

// 将 ExecStatus 类型转换为对应的颜色
const execStatusToColor = (status: ExecStatus) => {
    switch (status) {
        case 'none':
            return 'grey';
        case 'not-start':
            return 'grey';
        case 'start':
            return 'blue';
        case 'success':
            return 'green';
        case 'error':
            return 'red';
        default:
            return 'grey';
    }
};
const execStatusToCN = (status: ExecStatus) => {
    switch (status) {
        case 'none':
            return '不执行';
        case 'not-start':
            return '未开始';
        case 'start':
            return '执行中';
        case 'success':
            return '成功';
        case 'error':
            return '失败';
        default:
            return '未知';
    }
};

// 检测 scriptSelectInfo 变更，然后更改 scriptExecInfo
watchEffect(() => {
    for (const projectName in scriptSelectInfo) {
        if (Object.prototype.hasOwnProperty.call(scriptSelectInfo, projectName)) {
            const command = scriptSelectInfo[projectName];
            command === noneScript
                ? (scriptExecInfo[projectName] = 'none')
                : (scriptExecInfo[projectName] = 'not-start');
        }
    }
});

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

        & > * {
            &:not(:last-child) {
                margin-right: 20px;
            }
        }

        .project-status {
            width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dialog-project-name {
            text-align: left;
            flex: 0 0 250px;
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
