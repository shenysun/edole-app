<template>
    <div class="project-view">
        <header class="project-header">
            <span class="project-title">项目</span>
            <q-btn class="project-add" color="teal" label="添加项目" @click="onAddClick"></q-btn>
            <q-btn class="project-script" color="red-6" label="批量执行脚本" @click="onBatchScriptClick"></q-btn>
        </header>
        <q-separator style="margin: 20px 0"></q-separator>
        <div class="project-item-wrapper">
            <project-item
                v-for="info in projectList"
                :key="info.projectName"
                @delete="onDeleteItem"
                :info="info"
            ></project-item>
        </div>

        <q-dialog v-model="showScripts">
            <q-card>
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
                    <div v-for="projectName in [...scriptsMap.keys()]" :key="projectName" class="dialog-content-item">
                        <span class="dialog-project-name">{{ projectName }}</span>
                        <q-select
                            v-model="scriptSelectInfo[projectName]"
                            class="dialog-project-scripts"
                            filled
                            :options="scriptOptions(projectName)"
                        ></q-select>
                    </div>
                </q-card-section>
                <q-separator></q-separator>
                <q-card-section class="dialog-actions">
                    <q-btn color="secondary" label="批量执行" @click="onBatchActionClick"></q-btn>
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, computed } from 'vue';
import { ProjectInfo, BuildEnv } from '../meta';
import ProjectItem from './project-item.vue';
import { Loading, QBtn, QBtnDropdown, QCard, QCardSection, QDialog, QSelect, QSeparator, QSpace } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { storeToRefs } from 'pinia';
import { getBuildCommand } from 'src/common/utils/build-command';
import { useOSStore } from 'src/stores/os';

const noneScript = '不执行脚本';
const store = useProjectStore();
const os = useOSStore();
const { projectList, scriptsMap, scriptLatest } = storeToRefs(store);
const scriptSelectInfo = reactive<Record<string, string>>({});
const showScripts = ref(false);
const scriptOptions = computed(() => (projectName: string) => [
    noneScript,
    ...(scriptsMap.value.get(projectName) || []),
]);

const onAddClick = async () => {
    const projectInfoList = await electronExpose.shell.dialog();
    const curAddList = [];
    for (const projectInfo of projectInfoList) {
        const has = projectList.value.find((item) => item.path === projectInfo.path);
        if (!has) {
            curAddList.push(projectInfo.projectName);
            projectList.value.push(projectInfo);
        }
    }

    if (!curAddList.length) {
        return;
    }
    toast.show(`${curAddList.join(',')} 项目添加成功`, 'done');
};

const onBatchScriptClick = () => {
    showScripts.value = true;
};

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
        const cwd = store.getProjectCwd(projectName);
        if (cwd) {
            const command = scriptSelectInfo[projectName];
            if (command && command !== noneScript) {
                store.setScriptLatest(projectName, command);
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

const onDeleteItem = (info: ProjectInfo) => {
    const itemIndex = projectList.value.findIndex((item) => item.path === info.path);
    projectList.value.splice(itemIndex, 1);
    store.setBranchInfo(info.projectName);
    store.setScripts(info.projectName);
};

watch(
    scriptLatest,
    (val) => {
        const temp: Record<string, string> = {};
        for (const info of projectList.value) {
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
.project-view {
    display: flex;
    flex-direction: column;
    padding: 30px 20px 0;
    .project-header {
        display: flex;
        align-items: center;

        .project-title {
            font-size: 28px;
        }

        .project-add {
            margin-left: auto;
        }

        .project-script {
            margin-left: 12px;
        }
    }

    .project-item-wrapper {
        padding-right: 20px;
        overflow: auto;
    }
}

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
