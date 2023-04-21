<template>
    <q-layout view="lhh lpR fFf">
        <q-header elevated class="layout-header bg-grey-3 text-grey">
            <q-toolbar class="layout-toolbar">
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
                <q-toolbar-title class="layout-toolbar-title"> {{ selectGroup }} </q-toolbar-title>
            </q-toolbar>
        </q-header>

        <q-drawer class="" show-if-above v-model="leftDrawerOpen" side="left" bordered>
            <project-group />
        </q-drawer>

        <q-page-container class="page-container">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import ProjectGroup from 'components/project-group.vue';
import { useGroupStore } from 'src/stores/group';
import { storeToRefs } from 'pinia';

const leftDrawerOpen = ref(false);
const groupStore = useGroupStore();
const { selectGroup } = storeToRefs(groupStore);

const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>

<style lang="scss" scoped>
.layout-header {
    .layout-toolbar {
        // min-height: 35px;

        .layout-toolbar-title {
            font-size: 22px;
        }
    }
}

.page-container {
    padding-top: 30px !important;
}
</style>
