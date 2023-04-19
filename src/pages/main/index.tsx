import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { QBtn, QItem, QList, QMenu, QSelect } from 'quasar';
import styles from './style/index.module.scss';
import { LogInfo, LogLevel } from './meta';
import { useLocalStorage } from '@vueuse/core';
import { TypeExpose } from 'app/src-electron/preload/preload';

const projectKey = 'projectPath';
export default defineComponent({
    name: 'mainView',
    setup() {
        // const global = window as unknown as Record<
        //     string,
        //     Record<ShellEvent | StdEvent, (...args: unknown[]) => Promise<unknown>>
        // >;
        const global = window as unknown as TypeExpose;

        const projectInfo = useLocalStorage<{ path: string; projectName: string }>(
            projectKey,
            ref({ path: '', projectName: '' })
        );
        const refLog = ref<HTMLDivElement>();
        const logs = ref<LogInfo[]>([]);
        const branchs = ref<string[]>([]);
        const selectBranch = ref('');
        const scripts = ref<string[]>([]);
        const selectScript = ref('');
        const cwd = computed(() => projectInfo.value.path);

        const onDialog = async () => {
            const some = await global.shell.dialog();
            if (some) {
                projectInfo.value = some;
            }
            console.log(some);
        };

        const onRunScript = (command: string) => {
            global.shell.script({ command, cwd: cwd.value });
        };

        const onOpenCode = () => {
            global.shell.open({ cwd: cwd.value });
        };

        const onStdoutHandler = (e: any, chunk: string) => {
            logs.value.push({
                message: chunk + '',
            });
        };

        const onStderrHandler = (e: any, chunk: string) => {
            logs.value.push({
                message: chunk + '',
                level: LogLevel.warning,
            });
        };

        const getAllbranch = async (doneFn?: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void) => {
            const branchInfo = await global.shell.git({ command: 'branch', cwd: cwd.value });
            if (doneFn) {
                doneFn(() => {
                    branchs.value = branchInfo.all;
                    selectBranch.value = branchInfo.current;
                });
            } else {
                branchs.value = branchInfo.all;
                selectBranch.value = branchInfo.current;
            }
            return branchInfo;
        };

        const getAllScripts = async (doneFn?: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void) => {
            const scriptDict = await global.shell.scriptList({ cwd: cwd.value });
            const tempList = Object.keys(scriptDict);
            if (doneFn) {
                doneFn(() => {
                    scripts.value = tempList;
                    selectScript.value = tempList[0];
                });
            } else {
                scripts.value = tempList;
                selectScript.value = tempList[0];
            }
        };

        const filterBranch = (
            inputValue: string,
            doneFn: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void
        ) => {
            getAllbranch(doneFn);
        };

        watch(
            () => logs.value.length,
            () => {
                refLog.value?.scrollTo({
                    left: 0,
                    top: refLog.value.scrollHeight,
                    behavior: 'smooth',
                });
            },
            {
                flush: 'post',
            }
        );

        watch(selectBranch, (val, pre) => {
            if (!pre) {
                return;
            }

            if (val.startsWith('remotes/origin/')) {
                val = val.split('remotes/origin/')[1];
            }
            global.shell.git({ command: 'checkout', branch: val, cwd: cwd.value });
        });

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

        onMounted(() => {
            global.std.on('stdout', onStdoutHandler);
            global.std.on('stderr', onStderrHandler);
        });

        onBeforeUnmount(() => {
            global.std.off('stdout', onStdoutHandler);
            global.std.off('stderr', onStderrHandler);
        });

        return () => (
            <>
                <QBtn onClick={onDialog}>dialog</QBtn>
                <div>
                    <span>
                        {projectInfo.value.projectName} |||||
                        {cwd.value}
                    </span>
                    <div>
                        <QBtn onClick={onOpenCode}>open by code</QBtn>
                        <QSelect
                            filled
                            useChips
                            onFilter={filterBranch}
                            options={branchs.value}
                            v-model={selectBranch.value}
                        ></QSelect>
                    </div>
                    <div style="margin-top: 20px"></div>
                    <QBtn style="width: 180px;" label="执行脚本" color="primary">
                        <QMenu fit autoClose>
                            <QList>
                                {scripts.value.map((s) => (
                                    <QItem clickable key={s} onClick={() => onRunScript(s)}>
                                        {s}
                                    </QItem>
                                ))}
                            </QList>
                        </QMenu>
                    </QBtn>
                </div>

                <div class={styles.bottom} ref={refLog}>
                    {logs.value.map((log) => (
                        <pre
                            class={{ [styles.pretxt]: true, [styles[`pretxt-${log.level ?? 0}`]]: true }}
                            key={log.message}
                        >
                            {log.message}
                        </pre>
                    ))}
                </div>
            </>
        );
    },
});
