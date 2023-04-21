<template>
    <div class="manager">
        <project-view></project-view>
        <q-separator></q-separator>
        <logger-view></logger-view>
    </div>
</template>

<script lang="ts" setup>
import { QSeparator } from 'quasar';
import { electronExpose } from 'src/common/expose';
import { useOSStore } from 'src/stores/os';
import { onMounted } from 'vue';
import LoggerView from './components/logger-view.vue';
import ProjectView from './components/project-view.vue';

const os = useOSStore();

onMounted(async () => {
    const { platform } = await electronExpose.shell.init();
    os.setPlatform(platform);
});
</script>

<style lang="scss" scoped>
.manager {
    display: flex;
    flex-direction: column;
    height: 100vh;

    .project-view {
        min-height: 0;
        flex: 1 1 auto;
    }

    .logger-view {
        margin-top: auto;
        min-height: 0;
        flex: 0 0 200px;
    }
}
</style>
