<template>
    <q-toolbar class="bg-white text-primary">
        <q-toolbar-title> 项目管理工具 </q-toolbar-title>
        <q-btn outline round size="xs" icon="add" @click="onAddClick" />
    </q-toolbar>
    <q-list>
        <template v-for="group in groupList" :key="group.groupName">
            <q-item
                class="group-item"
                active-class="active-item"
                :active="selectGroup === group.groupName"
                @click="selectGroup = group.groupName"
                clickable
            >
                <q-item-section>
                    <q-item-label> {{ group.groupName }} </q-item-label>
                </q-item-section>
                <q-item-section class="rename-group" side>
                    <q-btn
                        size="xs"
                        color="secondary"
                        round
                        icon="edit"
                        @click.stop="onRenameGroup(group.groupName)"
                    ></q-btn>
                </q-item-section>
                <q-item-section class="delete-group" side>
                    <q-btn
                        size="xs"
                        color="red"
                        round
                        icon="delete"
                        @click.stop="onDeleteGroup(group.groupName)"
                    ></q-btn>
                </q-item-section>
            </q-item>
        </template>
    </q-list>
</template>

<script lang="ts" setup>
import { QToolbar, Dialog } from 'quasar';
import { useGroupStore } from 'src/stores/group';
import { storeToRefs } from 'pinia';
import toast from 'src/common/toast';

const groupStore = useGroupStore();
const { groupList, selectGroup } = storeToRefs(groupStore);

const changeGroup = (type: 'add' | 'rename', inputV: string, groupName: string) => {
    if (!inputV) {
        return toast.show('项目组名不能为空', 'error');
    }

    const sameName = groupList.value.find((g) => g.groupName === inputV);
    if (sameName) {
        return toast.show('已存在同名项目组', 'error');
    }

    if (type === 'add') {
        groupStore.addGroup(inputV);
    } else {
        groupStore.updateGroup(groupName, inputV);
    }
};

const onAddClick = () => {
    Dialog.create({
        title: '添加项目组',
        prompt: {
            model: '',
            type: 'text',
        },
        cancel: '取消',
        ok: '确定',
    }).onOk((inputV) => {
        changeGroup('add', inputV, '');
    });
};

const onDeleteGroup = (groupName: string) => {
    Dialog.create({
        title: '移除项目组',
        message: '是否从管理器中移除项组（不会删除源文件）',
        cancel: '取消',
        ok: '确定',
    }).onOk(() => {
        groupStore.removeGroup(groupName);
    });
};

const onRenameGroup = (groupName: string) => {
    Dialog.create({
        title: '重命名项目组',
        prompt: {
            model: groupName,
            type: 'text',
        },
        cancel: '取消',
        ok: '确定',
    }).onOk((inputV) => {
        changeGroup('rename', inputV, groupName);
    });
};
</script>
<style lang="scss" scoped>
.group-item {
    &.active-item {
        color: #fff;
        background-color: var(--q-primary);
    }

    .delete-group,
    .rename-group {
        display: none;
    }

    &:hover {
        .delete-group,
        .rename-group {
            display: block;
        }
    }
}
</style>
