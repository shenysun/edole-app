<template>
    <q-card style="min-width: 550px">
        <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">批量执行脚本</div>
            <q-space />
            <q-btn-dropdown outline auto-close label="一键配置">
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
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="dialog-content">
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
import { computed, reactive, watch } from 'vue';
import { BuildEnv } from '../meta';

const os = useOSStore();
const groupStore = useGroupStore();
const projectStore = useProjectStore();
const { currentProjectList } = storeToRefs(groupStore);
const { scriptsMap, scriptLatest } = storeToRefs(projectStore);
const scriptSelectInfo = reactive<Record<string, string>>({});

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

const onBatchActionClick = async () => {
    const projectNames = Object.keys(scriptSelectInfo);
    const list: Array<{ cwd: string; command: string }> = [];
    projectNames.forEach((projectName) => {
        const cwd = groupStore.getProjectCwd(projectName);
        if (cwd) {
            const command = scriptSelectInfo[projectName];
            if (command && command !== noneScript) {
                projectStore.setScriptLatest(projectName, command);
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
</script>
<style lang="scss" scoped>
.dialog-content {
    height: 70vh;
    overflow: auto;

    .dialog-content-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .dialog-project-name {
            text-align: left;
            flex: 0 0 300px;
        }

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
