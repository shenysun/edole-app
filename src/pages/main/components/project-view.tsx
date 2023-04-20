import { useLocalStorage } from '@vueuse/core';
import { defineComponent, ref } from 'vue';
import { ProjectInfo } from '../meta';
import ProjectItem from './project-item';
import style from '../style/project.module.scss';
import { QBtn, QSeparator } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
const projectsInfoKey = 'projectsInfo';

export default defineComponent({
    name: 'project-view',
    setup() {
        const projectList = useLocalStorage<ProjectInfo[]>(projectsInfoKey, ref([]));
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

        const onDeleteItem = (info: ProjectInfo) => {
            const itemIndex = projectList.value.findIndex((item) => item.path === info.path);
            projectList.value.splice(itemIndex, 1);
        };

        return () => (
            <div class={style['project-view']}>
                <header class={style['project-header']}>
                    <span class={style['project-title']}>项目</span>
                    <QBtn class={style['project-add']} label="添加项目" onClick={onAddClick}></QBtn>
                </header>
                <QSeparator style="margin: 20px 0;"></QSeparator>
                <div class={style['project-item-wrapper']}>
                    {projectList.value.map((info) => (
                        <ProjectItem onDelete={onDeleteItem} info={info} key={info.projectName}></ProjectItem>
                    ))}
                </div>
            </div>
        );
    },
});
