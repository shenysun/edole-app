<template>
    <div class="project-view">
        <header class="project-header">
            <span class="project-title">项目</span>
            <QBtn class="project-add" label="添加项目" @click="onAddClick"></QBtn>
            <QBtn class="project-script" label="批量执行脚本" @click="onBatchScriptClick"></QBtn>
        </header>
        <QSeparator style="margin: 20px 0"></QSeparator>
        <div class="project-item-wrapper">
            <ProjectItem
                v-for="info in projectList"
                :key="info.projectName"
                @delete="onDeleteItem"
                :info="info"
            ></ProjectItem>
        </div>

        <QDialog v-model="showScripts">
            <QCard>
                <QCardSection class="row items-center q-pb-none">
                    <div class="text-h6">批量执行脚本</div>
                    <QSpace />
                    <QBtn icon="close" flat round dense v-close-popup />
                </QCardSection>

                <QCardSection class="dialog-content">
                    <div v-for="projectName in [...scriptsMap.keys()]" :key="projectName" class="dialog-content-item">
                        <span class="dialog-project-name">{projectName}</span>
                        <QSelect
                            v-model="scriptSelectInfo[projectName]"
                            class="dialog-project-scripts"
                            filled
                            :options="scriptsMap.get(projectName)"
                        ></QSelect>
                    </div>
                </QCardSection>
                <QSeparator></QSeparator>
                <QCardSection class="dialog-actions">
                    <QBtn color="secondary" label="批量执行" @click="onBatchActionClick"></QBtn>
                </QCardSection>
            </QCard>
        </QDialog>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { ProjectInfo } from '../meta';
import ProjectItem from './project-item.vue';
import { Loading, QBtn, QCard, QCardSection, QDialog, QSelect, QSeparator, QSpace } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { storeToRefs } from 'pinia';

const store = useProjectStore();
const { projectList, scriptsMap, scriptLatest } = storeToRefs(store);
const scriptSelectInfo = reactive<Record<string, string>>({});
const showScripts = ref(false);

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

const onBatchActionClick = async () => {
    const projectNames = Object.keys(scriptSelectInfo);
    const list: Array<{ cwd: string; command: string }> = [];
    projectNames.forEach((projectName) => {
        const cwd = store.getProjectCwd(projectName);
        if (cwd) {
            const command = scriptSelectInfo[projectName];
            store.setScriptLatest(projectName, command);
            list.push({
                cwd,
                command,
            });
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
        if (val) {
            Object.assign(scriptSelectInfo, val);
        }
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
        }
    }
}

.dialog-actions {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
