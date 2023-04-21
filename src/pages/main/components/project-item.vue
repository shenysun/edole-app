<template>
    <div class="project-item">
        <q-slideItem
            rightColor="grey-7"
            @right="({ reset }) => onDeleteItem(props.info, reset)"
            @click="onOpenFileClick"
        >
            <template v-slot:right>
                <q-icon name="done"></q-icon>
            </template>
            <div class="project-info">
                <span class="project-name">
                    {{ props.info.projectName }}
                    <q-tooltip>{{ props.info.projectName }}</q-tooltip>
                </span>
                <span class="project-path">
                    项目路径： {{ props.info.path }}
                    <q-tooltip>{{ props.info.path }}</q-tooltip>
                </span>
            </div>
        </q-slideItem>
        <div class="project-actions">
            <q-select
                v-if="branchInfo"
                v-model="branchInfo.current"
                class="project-actions-select"
                filled
                @filter="(_input, doneFn) => getAllbranch(doneFn)"
                :options="branchInfo.all"
                menu-self="top middle"
                menu-anchor="bottom middle"
            ></q-select>

            <q-btn color="primary" icon="code" label="打开" @click="onOpenClick"></q-btn>
            <q-btn color="primary" icon="task" label="执行脚本">
                <q-menu fit autoClose>
                    <q-list>
                        <q-item v-for="s in scripts" :key="s" clickable @click="onRunScript(s)"> {{ s }} </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
        </div>
    </div>
    <q-separator style="margin: 10px 0"></q-separator>
</template>

<script lang="ts" setup>
import { Dialog, QBtn, QIcon, QItem, QList, QSelect, QSeparator, QSlideItem, QTooltip } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { computed, watch, defineProps } from 'vue';
import { ProjectInfo } from '../meta';

const props = defineProps<{ info: ProjectInfo }>();
const emit = defineEmits(['delete']);
const store = useProjectStore();
const cwd = computed(() => props.info.path);
const projectName = computed(() => props.info.projectName);
const branchInfo = computed(() => store.getBranchInfo(projectName.value));
const scripts = computed(() => store.getScripts(projectName.value));

const onOpenClick = async () => {
    electronExpose.shell.openEditor({ cwd: cwd.value });
};

const onOpenFileClick = () => {
    electronExpose.shell.open({ cwd: cwd.value });
};

/**
 * 获取所有分支
 * @param doneFn
 */
const getAllbranch = async (doneFn?: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void) => {
    const info = await electronExpose.shell.git({ command: 'branch', cwd: cwd.value });
    if (doneFn) {
        doneFn(() => {
            store.setBranchInfo(projectName, info);
        });
    } else {
        store.setBranchInfo(projectName, info);
    }
};

/**
 * 切换分支
 * @param branch
 */
const checkoutBranch = async (branch: string) => {
    await electronExpose.shell.git({ command: 'checkout', branch, cwd: cwd.value });
    await getAllbranch();
    toast.show(`切换分支${branch}成功`, 'done');
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
        const { projectName: pn } = await electronExpose.shell.script({ command, cwd: cwd.value });
        toast.show(`${pn}执行脚本${command} 成功`, 'done');
    } catch (error) {
        console.log('error', error);

        toast.show(`${projectName.value}执行脚本${command} 失败 ${error}`, 'error');
    }
};

/**
 * 移除项目
 * @param info
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

watch(
    cwd,
    (val) => {
        if (val) {
            getAllbranch();
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
        flex: 1 1 30%;
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
        flex: 1 1 70%;
        display: flex;
        gap: 10px;
        align-items: center;

        & > *:first-child {
            margin-left: auto;
        }

        .project-actions-select {
            width: 200px;

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
</style>
