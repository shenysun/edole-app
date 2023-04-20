<template>
    <div class="manager">
        <ProjectView></ProjectView>
        <QSeparator></QSeparator>
        <LoggerView></LoggerView>
    </div>
</template>

<script lang="ts" setup>
import { QSeparator } from 'quasar';
import LoggerView from './components/logger-view.vue';
import ProjectView from './components/project-view.vue';
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
