<template>
    <div class="project-item">
        <q-slide-item
            rightColor="grey-7"
            @right="({ reset }) => onDeleteItem(projectInfo, reset)"
            @click="onOpenFileClick"
        >
            <template v-slot:right>
                <q-icon name="done"></q-icon>
            </template>
            <div class="project-info">
                <span class="project-name">
                    {{ projectInfo.projectName }}
                </span>
                <span class="project-path">
                    项目路径： {{ projectInfo.path }}
                    <q-tooltip>{{ projectInfo.path }}</q-tooltip>
                </span>
            </div>
        </q-slide-item>
        <div class="project-actions">
            <all-branch class="project-actions-select" :project-info="projectInfo" auto-check-branch></all-branch>
            <q-btn-dropdown
                class="tools-btn-dropdown"
                color="primary"
                :label="scriptExecStatus[projectInfo.projectName] ? '执行中...' : '执行脚本'"
                :disable="scriptExecStatus[projectInfo.projectName]"
                menu-anchor="bottom middle"
                menu-self="top middle"
                rounded
                auto-close
            >
                <q-list>
                    <q-item v-for="s in scripts" :key="s" clickable @click="onRunScript(s)"> {{ s }} </q-item>
                </q-list>
            </q-btn-dropdown>
            <q-btn-dropdown
                class="tools-btn-dropdown"
                color="primary"
                label="更多操作"
                menu-anchor="bottom middle"
                menu-self="top middle"
                rounded
                auto-close
            >
                <q-list>
                    <q-item clickable @click="onOpenClick">
                        <q-item-section>
                            <q-item-label>打开</q-item-label>
                        </q-item-section>
                    </q-item>
                    <q-item clickable @click="onPullClick">
                        <q-item-section>
                            <q-item-label>拉取代码</q-item-label>
                        </q-item-section>
                    </q-item>
                    <q-item clickable @click="onCreateBranch">
                        <q-item-section>
                            <q-item-label>创建分支</q-item-label>
                        </q-item-section>
                    </q-item>
                    <q-item clickable @click="onMergeBranch">
                        <q-item-section>
                            <q-item-label>合并分支</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>
        </div>
    </div>
    <q-separator style="margin: 10px 0"></q-separator>
</template>

<script lang="ts" setup>
import { Dialog, QIcon, QItem, QList, QSelect, QSeparator, QSlideItem, QTooltip } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectItem } from 'src/composable/useProjectItem';
import { useProjectStore } from 'src/stores/project';
import { computed, watch, reactive } from 'vue';
import { ProjectInfo } from '../meta';
import AllBranch from './all-branch.vue';

interface Props {
    projectInfo: ProjectInfo;
}

const props = defineProps<Props>();
const emit = defineEmits(['delete', 'create-branch', 'merge-branch']);
const store = useProjectStore();
const { cwd, projectName, updateBranches } = useProjectItem(props.projectInfo);
const scripts = computed(() => store.getScripts(projectName.value));
const scriptExecStatus = reactive<Record<string, boolean>>({});

const onOpenClick = () => {
    electronExpose.shell.openEditor({ cwd: cwd.value });
};

const onPullClick = async () => {
    await electronExpose.git.pull({ cwd: cwd.value });
    toast.show(`${projectName.value} 拉取代码成功`, 'done');
};

const onCreateBranch = () => {
    emit('create-branch', props.projectInfo);
};

const onMergeBranch = () => {
    emit('merge-branch', props.projectInfo);
};

const onOpenFileClick = () => {
    electronExpose.shell.open({ cwd: cwd.value });
};

const getAllScripts = async (doneFn?: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void) => {
    const scriptDict = await electronExpose.shell.scriptList({ cwd: cwd.value });
    const tempList = Object.keys(scriptDict);
    if (doneFn) {
        doneFn(() => {
            store.setScripts(projectName, tempList);
        });
    } else {
        store.setScripts(projectName, tempList);
    }
};

const onRunScript = async (command: string) => {
    try {
        store.setScriptLatest(projectName.value, command);
        scriptExecStatus[projectName.value] = true;
        const { projectName: pn } = await electronExpose.shell.script({ command, cwd: cwd.value });
        toast.show(`${pn}执行脚本${command} 成功`, 'done');
    } catch (error) {
        console.log('error', error);
        toast.show(`${projectName.value}执行脚本${command} 失败 ${error}`, 'error');
    } finally {
        scriptExecStatus[projectName.value] = false;
    }
};

/**
 * 移除项目
 * @param info
 * @param reset
 */
const onDeleteItem = (info: ProjectInfo, reset: () => void) => {
    Dialog.create({
        title: '移除项目',
        message: '是否从管理器中移除项目（不会删除源文件）',
        cancel: true,
    })
        .onOk(() => {
            emit('delete', info);
        })
        .onCancel(reset);
};

watch(
    cwd,
    (val) => {
        if (val) {
            updateBranches();
            getAllScripts();
        }
    },
    {
        immediate: true,
    }
);
</script>
<style lang="scss" scoped>
.project-item {
    display: flex;
    align-items: center;

    .project-info {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;

        .project-name {
            font-size: 20px;
        }

        .project-path,
        .project-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .project-actions {
        flex: 1 0 auto;
        margin-left: 5%;
        display: flex;
        gap: 10px;
        align-items: center;

        & > *:first-child {
            margin-left: auto;
        }

        .tools-btn-dropdown {
            padding: 4px 4px 4px 12px;

            :deep(.q-btn-dropdown__arrow) {
                margin-left: 1px;
            }

            :deep(.q-btn__content) {
                min-width: 81px;
            }
        }

        .project-actions-select {
            width: 200px;
        }
    }
}
</style>
