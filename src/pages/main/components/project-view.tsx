import { defineComponent, reactive, ref, watch } from 'vue';
import { ProjectInfo } from '../meta';
import ProjectItem from './project-item';
import style from '../style/project.module.scss';
import { Loading, QBtn, QCard, QCardSection, QDialog, QSelect, QSeparator, QSpace } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { storeToRefs } from 'pinia';

export default defineComponent({
    name: 'project-view',
    setup() {
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

        const renderScripts = () => {
            const projectNames = [...scriptsMap.value.keys()];
            return projectNames.map((projectName) => (
                <div class={style['dialog-content-item']}>
                    <span class={style['dialog-project-name']}>{projectName}</span>
                    <QSelect
                        class={style['dialog-project-scripts']}
                        filled
                        options={scriptsMap.value.get(projectName)}
                        v-model={scriptSelectInfo[projectName]}
                    ></QSelect>
                </div>
            ));
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

        return () => (
            <div class={style['project-view']}>
                <header class={style['project-header']}>
                    <span class={style['project-title']}>项目</span>
                    <QBtn class={style['project-add']} label="添加项目" onClick={onAddClick}></QBtn>
                    <QBtn class={style['project-script']} label="批量执行脚本" onClick={onBatchScriptClick}></QBtn>
                </header>
                <QSeparator style="margin: 20px 0;"></QSeparator>
                <div class={style['project-item-wrapper']}>
                    {projectList.value.map((info) => (
                        <ProjectItem onDelete={onDeleteItem} info={info} key={info.projectName}></ProjectItem>
                    ))}
                </div>

                <QDialog v-model={showScripts.value}>
                    <QCard>
                        <QCardSection class="row items-center q-pb-none">
                            <div class="text-h6">批量执行脚本</div>
                            <QSpace />
                            <QBtn icon="close" flat round dense v-close-popup />
                        </QCardSection>

                        <QCardSection class={style['dialog-content']}>{renderScripts()}</QCardSection>
                        <QSeparator></QSeparator>
                        <QCardSection class={style['dialog-actions']}>
                            <QBtn color="secondary" label="批量执行" onClick={onBatchActionClick}></QBtn>
                        </QCardSection>
                    </QCard>
                </QDialog>
            </div>
        );
    },
});
