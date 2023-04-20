import { useLocalStorage } from '@vueuse/core';
import { defineComponent, ref } from 'vue';
import { ProjectInfo } from '../meta';
import ProjectItem from './project-item';
import style from '../style/project.module.scss';
import { QBtn, QCard, QCardSection, QDialog, QSeparator, QSpace } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
const projectsInfoKey = 'projectsInfo';

export default defineComponent({
    name: 'project-view',
    setup() {
        const projectList = useLocalStorage<ProjectInfo[]>(projectsInfoKey, ref([]));
        const icon = ref(false);

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
            console.log('批量执行脚本');
            icon.value = true;
        };

        const onDeleteItem = (info: ProjectInfo) => {
            const itemIndex = projectList.value.findIndex((item) => item.path === info.path);
            projectList.value.splice(itemIndex, 1);
        };

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

                <QDialog v-model={icon.value}>
                    <QCard>
                        <QCardSection class="row items-center q-pb-none">
                            <div class="text-h6">批量执行脚本</div>
                            <QSpace />
                            <QBtn icon="close" flat round dense v-close-popup />
                        </QCardSection>

                        <QCardSection>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum repellendus sit voluptate
                            voluptas eveniet porro. Rerum blanditiis perferendis totam, ea at omnis vel numquam
                            exercitationem aut, natus minima, porro labore.
                        </QCardSection>
                    </QCard>
                </QDialog>
            </div>
        );
    },
});
