<template>
    <div class="logger-view" ref="refLog">
        <div class="text-grey-8">终端日志</div>
        <pre v-for="log in logs" :class="['pretxt', `pretxt-${log.level ?? 0}`]" :key="log.message">
            {{ log.message }}
        </pre>
    </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { LogInfo, LogLevel } from '../meta';
import { electronExpose } from 'src/common/expose';
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
    electronExpose.app.on('stdout', onStdoutHandler);
    electronExpose.app.on('stderr', onStderrHandler);
});

onBeforeUnmount(() => {
    electronExpose.app.off('stdout', onStdoutHandler);
    electronExpose.app.off('stderr', onStderrHandler);
});
</script>
<style lang="scss" scoped>
.logger-view {
    padding: 10px;
    overflow: auto;

    .pretxt {
        white-space: pre-wrap;

        // 日志
        &.pretxt-0 {
            color: #656161;
        }

        // 警告
        &.pretxt-1 {
            color: #ffb301;
        }

        // 错误
        &.pretxt-2 {
            color: #f12929;
        }
    }
}
</style>
