<template>
    <q-layout view="lhh lpR fFf">
        <q-header elevated class="layout-header bg-white text-primary">
            <q-toolbar class="layout-toolbar">
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
                <q-toolbar-title class="layout-toolbar-title"> {{ selectGroup }} </q-toolbar-title>
                <header-tools />
            </q-toolbar>
        </q-header>

        <q-drawer
            style="box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1), 0 0px 10px rgba(0, 0, 0, 0.014)"
            v-model="leftDrawerOpen"
            :width="230"
            show-if-above
            side="left"
        >
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
import HeaderTools from 'src/pages/main/components/header-tools.vue';
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
        }
    }
}

.page-container {
    padding-top: 30px !important;
}
</style>
