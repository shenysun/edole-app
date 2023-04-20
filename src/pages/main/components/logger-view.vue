<template>
    <div class="logger-view" ref="refLog">
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
    electronExpose.std.on('stdout', onStdoutHandler);
    electronExpose.std.on('stderr', onStderrHandler);
});

onBeforeUnmount(() => {
    electronExpose.std.off('stdout', onStdoutHandler);
    electronExpose.std.off('stderr', onStderrHandler);
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
