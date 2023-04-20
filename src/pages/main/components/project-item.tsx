import { Dialog, QBtn, QIcon, QItem, QList, QMenu, QSelect, QSeparator, QSlideItem, QTooltip } from 'quasar';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';
import { useProjectStore } from 'src/stores/project';
import { computed, defineComponent, PropType, watch } from 'vue';
import { ProjectInfo } from '../meta';
import style from '../style/project.module.scss';

export default defineComponent({
    name: 'ProjectItem',
    props: {
        info: {
            type: Object as PropType<ProjectInfo>,
            required: true,
        },
    },
    emits: ['delete'],
    setup(props, { emit }) {
        const store = useProjectStore();
        const cwd = computed(() => props.info.path);
        const projectName = computed(() => props.info.projectName);
        const branchInfo = computed(() => store.getBranchInfo(projectName.value));
        const scripts = computed(() => store.getScripts(projectName.value));

        const onOpenClick = async () => {
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

        return () => (
            <>
                <div class={style['project-item']}>
                    <QSlideItem rightColor="red" onRight={({ reset }) => onDeleteItem(props.info, reset)}>
                        {{
                            default: () => (
                                <div class={style['project-info']}>
                                    <span class={style['project-name']}>
                                        {props.info.projectName}
                                        <QTooltip>{props.info.projectName}</QTooltip>
                                    </span>
                                    <span class={style['project-path']}>
                                        项目路径： {props.info.path}
                                        <QTooltip>{props.info.path}</QTooltip>
                                    </span>
                                </div>
                            ),
                            right: () => <QIcon name="done"></QIcon>,
                        }}
                    </QSlideItem>
                    <div class={style['project-actions']}>
                        {branchInfo.value ? (
                            <QSelect
                                class={style['project-actions-select']}
                                filled
                                onFilter={(_input, doneFn) => getAllbranch(doneFn)}
                                options={branchInfo.value.all}
                                v-model={branchInfo.value.current}
                            ></QSelect>
                        ) : (
                            ''
                        )}
                        <QBtn color="primary" icon="code" label="打开" onClick={onOpenClick}></QBtn>
                        <QBtn color="primary" icon="task" label="执行脚本">
                            <QMenu fit autoClose>
                                <QList>
                                    {scripts.value?.map((s) => (
                                        <QItem clickable key={s} onClick={() => onRunScript(s)}>
                                            {s}
                                        </QItem>
                                    ))}
                                </QList>
                            </QMenu>
                        </QBtn>
                    </div>
                </div>
                <QSeparator style="margin: 10px 0;"></QSeparator>
            </>
        );
    },
});
