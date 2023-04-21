<template>
    <q-toolbar class="bg-grey-3">
        <q-toolbar-title>
            <q-icon name="done"></q-icon>
            项目管理工具
        </q-toolbar-title>
        <q-btn outline round size="xs" icon="add" @click="dialogShow = true" />
    </q-toolbar>
    <q-list>
        <template v-for="gName in groupNameList" :key="gName">
            <q-item
                class="group-item"
                active-class="active-item"
                :active="selectGroup === gName"
                @click="selectGroup = gName"
                clickable
            >
                <q-item-section>
                    <q-item-label>{{ gName }}</q-item-label>
                </q-item-section>
                <q-item-section class="delete-group" side>
                    <q-btn size="xs" round icon="delete" @click.stop="onDeleteGroup(gName)"></q-btn>
                </q-item-section>
            </q-item>
        </template>
    </q-list>
    <q-dialog v-model="dialogShow" @keyup.enter="onAddClick">
        <q-card style="min-width: 350px">
            <q-card-section>
                <div class="text-h6">添加项目组</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
                <q-input dense v-model="inputGroupName" autofocus />
            </q-card-section>
            <q-card-actions align="right" class="text-primary">
                <q-btn flat label="取消" v-close-popup />
                <q-btn flat label="添加组" v-close-popup :disable="!inputGroupName.length" @click="onAddClick" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts" setup>
import { QToolbar, Dialog } from 'quasar';
import { ref } from 'vue';
import { useGroupStore } from 'src/stores/group';
import { storeToRefs } from 'pinia';

const groupStore = useGroupStore();
const { groupNameList, selectGroup } = storeToRefs(groupStore);
const dialogShow = ref(false);
const inputGroupName = ref('');

const onAddClick = () => {
    if (!inputGroupName.value) {
        return;
    }

    dialogShow.value = false;
    groupStore.addGroup(inputGroupName.value);
    inputGroupName.value = '';
};

const onDeleteGroup = (groupName: string) => {
    Dialog.create({
        title: '移除项目组',
        message: '是否从管理器中移除项组（不会删除源文件）',
        cancel: true,
    }).onOk(() => {
        groupStore.removeGroup(groupName);
    });
};
</script>
<style lang="scss" scoped>
.group-item {
    &.active-item {
        background-color: rgb(198, 208, 208);
    }

    .delete-group {
        display: none;
    }

    &:hover {
        .delete-group {
            display: block;
        }
    }
}
</style>
