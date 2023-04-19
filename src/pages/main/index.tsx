import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { QBtn, QSelect } from 'quasar';
import { ShellEvent, StdEvent } from 'app/src-electron/events/ShellEvent';
import styles from './style/index.module.scss';
import { LogInfo, LogLevel } from './meta';

export default defineComponent({
    name: 'mainView',
    setup() {
        const global = window as unknown as Record<
            string,
            Record<ShellEvent | StdEvent, (...args: unknown[]) => Promise<unknown>>
        >;
        const projectPath = ref(localStorage.getItem('projectPath') || '');
        const refLog = ref<HTMLDivElement>();
        const logs = ref<LogInfo[]>([]);
        const branchs = ref<string[]>(['2', '3']);
        const selectBranch = ref('');

        const onDialog = async () => {
            const some = await global.shell.dialog();
            if (some) {
                projectPath.value = some as string;
                localStorage.setItem('projectPath', projectPath.value);
            }
            console.log(some);
        };

        const onRun = () => {
            global.shell.script({ command: 'build:test', cwd: projectPath.value });
        };

        const onOpenCode = () => {
            global.shell.open({ cwd: projectPath.value });
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
            const branchInfo = (await global.shell.git({ command: 'branch', cwd: projectPath.value })) as any;
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

        const filterBranch = (
            inputValue: string,
            doneFn: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void,
            abortFn: () => void
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
            global.shell.git({ command: 'checkout', branch: val, cwd: projectPath.value });
        });

        onMounted(() => {
            getAllbranch();
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
                    <span>{projectPath.value}</span>
                    <div>
                        <QBtn onClick={onRun}>run build:test</QBtn>
                        <QBtn onClick={onOpenCode}>open by code</QBtn>
                        <QSelect
                            filled
                            useChips
                            onFilter={filterBranch}
                            options={branchs.value}
                            v-model={selectBranch.value}
                        ></QSelect>
                    </div>
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
