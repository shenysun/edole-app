import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { QBtn } from 'quasar';
import { ShellEvent, StdEvent } from 'app/src-electron/events/ShellEvent';
import styles from './index.module.scss';
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

        const onDialog = async () => {
            const some = await global.shell.dialog();
            if (some) {
                projectPath.value = some as string;
                localStorage.setItem('projectPath', projectPath.value);
            }
            console.log(some);
        };

        const onPull = async () => {
            await global.shell.git({ command: 'pulll', cwd: projectPath.value });
        };

        const onRun = () => {
            global.shell.script({ command: 'build:test', cwd: projectPath.value });
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
                    <span>{projectPath.value}</span>
                    <div>
                        <QBtn onClick={onPull}>git pull</QBtn>
                        <QBtn onClick={onRun}>run build:test</QBtn>
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
