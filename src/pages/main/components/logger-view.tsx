import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import styles from '../style/logger.module.scss';
import { LogInfo, LogLevel } from '../meta';
import { electronExpose } from 'src/common/expose';
import toast from 'src/common/toast';

export default defineComponent({
    name: 'logger-view',
    setup() {
        const refLog = ref<HTMLDivElement>();
        const logs = ref<Array<LogInfo>>([]);

        const onStdoutHandler = (e: unknown, chunk: string) => {
            logs.value.push({
                message: chunk + '',
            });
        };

        const onStderrHandler = (e: unknown, chunk: string) => {
            logs.value.push({
                message: chunk + '',
                level: LogLevel.warning,
            });
        };

        const onStdexitHandler = (e: unknown, { command, projectName }: { command: string; projectName: string }) => {
            toast.show(`${projectName} 脚本 ${command} 执行完毕`, 'done');
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
            electronExpose.std.on('stdout', onStdoutHandler);
            electronExpose.std.on('stderr', onStderrHandler);
            electronExpose.std.on('stdexit', onStdexitHandler);
        });

        onBeforeUnmount(() => {
            electronExpose.std.off('stdout', onStdoutHandler);
            electronExpose.std.off('stderr', onStderrHandler);
            electronExpose.std.off('stdexit', onStdexitHandler);
        });

        return () => (
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
        );
    },
});
