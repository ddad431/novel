<template>
    <view class="book-group h-screen bg-[var(--bookgroup-bg)]">
        <view class="header color-[var(--bookgroup-header-color)] fixed w-[calc(100vw-32px)] h-[36px] m-[16px] flex justify-between items-center">
            <view class="icon-nav relative left-[-6px]" @click="handleNavBack"></view>
            <!-- <view>{{ bookgroup?.name }}</view> -->
            <view class="icon-dots" @click="handleActiveActionPanel "></view>
        </view>
        <scroll-view 
            :scroll-y="true"
            :show-scrollbar="false"
            class="relative top-[calc(36px+32px)] left-[16px] w-[calc(100vw-32px)] h-[calc(100vh-36px-32px-16px)]"
        >
            <view class="wrapper flex flex-wrap justify-between">
                <view v-for="(book, index) in bookgroup?.data" :key="index" class="book-container flex flex-col justify-between">
                    <view 
                        class="relative h-[75%] rounded-[6px] hover:filter-brightness-95"
                        :class="book.select ? 'filter-brightness-95' : ''"
                        @longpress="handleLongPress"
                        @click="handleClickBook(book)"
                        :style="bookCoverStyles(book)"
                    >
                        <Transition name="zoom">
                            <view v-if="!isEditing" class="status bg-[var(--bookgroup-cover-status-bg)] color-[var(--bookgroup-cover-status-color)] absolute top-0 right-0 p-[4px_6px] rounded-bl-[6px] rounded-tr-[6px]">
                                <view class="text-[10px]">{{ getBookStatusLable(book) }}</view>
                            </view>
                            <view v-else-if="isEditing" class="select color-[var(--bookshelf-cover-select-color)] absolute right-[4px] bottom-[-1px] ">
                                <view :class="book.select ? 'icon-selected' : 'icon-unselected'"></view>
                            </view>
                        </Transition>
                    </view>
                    <view class="info flex flex-col">
                        <view class="flex-2 text-[13px] color-[var(--bookgroup-info-color-1)] font-500 truncate">{{ book.name }}</view>
                        <view class="flex-1 text-[12px] color-[var(--bookgroup-info-color-2)]">{{ getBookReadProgress(book) }}</view>
                    </view>
                </view>
            </view>
        </scroll-view>
      
        <!-- action panel -->
        <SelfOverlay v-model="actionPanelVisible" :mask="true" position="bottom" :teleport="true" >
            <view class="bg-[var(--action-panel-bg)] color-[var(--action-panel-icon-color)] h-[100px] w-full m-[8px] box-border p-[16px] rounded-[12px] flex justify-around items-center">
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]">
                    <view class="icon-rename scale-105" @click="handleActionPanelRenameGroup"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.重命名')}}</view>
                </view>
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleActionPanelEditing">
                    <view class="icon-edit"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.管理')}}</view>
                </view>
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleActionPanelCleanGroup">
                    <view class="icon-group-remove"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.解散分组')}}</view>
                </view>
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleActionPanelDeleteGroup">
                    <view class="icon-group-delete color-[var(--action-panel-delete-color)]"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.删除分组')}}</view>
                </view>
            </view>
        </SelfOverlay>

        <!-- edit panel -->
        <SelfOverlay v-model="editPanelVisible" :mask="false" position="bottom" :teleport="true" :penetrate="true" :onClose="handleEditPanelClose">
            <view class="bg-[var(--action-panel-bg)] color-[var(--action-panel-icon-color)] h-[100px] w-full m-[8px] box-border p-[16px] rounded-[12px] flex justify-around items-center">
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelToggleSelectAllBooks">
                    <view :class="[isSelectedGropAllBooks ? 'icon-select-all ' : 'icon-unselect-all']"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ isSelectedGropAllBooks ? $t('bookgroup.取消全选') : $t('bookgroup.全选') }}</view>
                </view>
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelActiveGroupMgrPanel">
                    <view class="icon-move" :class="[selectedGroupBookCounts === 0 ? 'color-[var(--action-panel-icon-disable-color)]' : '']"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.分组')}}</view>
                </view>
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelCancel">
                    <view class="icon-cancel"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.取消')}}</view>
                </view>
                <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelRemoveBook">
                    <view class="icon-delete scale-120" :class="[selectedGroupBookCounts === 0 ? 'color-[var(--action-panel-icon-disable-color)]' : 'color-[var(--action-panel-delete-color)]']"></view>
                    <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookgroup.移除') }} {{ '(' + selectedGroupBookCounts + ')'}}</view>
                </view>
            </view>
        </SelfOverlay>

        <!-- group manage panel  -->
        <SelfOverlay v-model="groupMgrPanelVisible" :mask="true" position="bottom" :onClose="handleGroupMgrPanelClose">
            <view class="group-edit-container bg-[var(--group-panel-bg)] text-[15px] w-full m-[8px] box-border p-[16px] rounded-[12px] flex flex-col gap-[12px]">
                <view class="title h-[24px] color-[--group-panel-title-color] text-left font-bold">{{ $t('group_panel.分组管理') }}</view>

                <!--
                    main （内容列表）
                    - action 列表（添加新分组、从分组移出）
                    - 分组列表（点击事件，移动到其他分组）
                    - 最多显示 6 个条目（1 个 action，5 个分组 | 2 个 action，4 个分组）
                    - 最大高度是 6 * 24 + 5 * 12 = 204，最小是 2 个条目 (24 + 12 + 24 = 60)
                -->
                <view class="main w-full min-h-[60px] max-h-[204px] bg-[var(--group-panel-bg)] flex flex-col gap-[12px] overflow-scroll no-scrollbar">
                    <view class="actions color-[var(--group-panel-action-color)] flex flex-col gap-[12px]">
                        <!-- NOTE 书架页没有移除分组 -->
                        <view class="leave h-[24px] flex items-center gap-[8px]" @click="handleGroupMgrMoveBookToBookshelf">
                            <view class="icon-group-leave scale-80"></view>
                            <view class="">{{ $t('group_panel.移出分组') }}</view>
                        </view>
                        <view class="create h-[24px] flex items-center gap-[8px]" @click="handleGroupMgrAddGroup">
                            <view class="icon-group-add scale-80"></view>
                            <view class="">{{ $t('group_panel.新建分组') }}</view>
                        </view>
                    </view>
                    <view class="groups color-[var(--group-panel-list-color)] flex flex-col gap-[8px]">
                        <!-- NOTE 这里的分组列表不显示当前分组（毕竟没有移动到自己分组这件事） -->
                        <view
                            v-for="(value, index) in groups.map(v => v.name).filter(v => v !== bookgroup?.name)"
                            class="group h-[24px] flex gap-[8px] items-center"
                            :key="index"
                            @click="handleGroupMgrChangeBookGroup(value)"
                        >
                            <view class="icon-group scale-80"></view>
                            <view>{{ value }}</view>
                        </view>
                    </view>
                </view>
            </view>
        </SelfOverlay>

        <!-- rename group dialog -->
        <SelfOverlay v-model="renameGroupDialogVisible" :mask="true" position="center" :zindex="10">
            <view class="w-screen m-[48px] rounded-[8px] box-border flex flex-col">
                <view class="bg-[var(--input-dialog-bg)] h-[65%] box-border p-[16px] rounded-t-[8px] color-[#555]  flex flex-col justify-between">
                    <view class="title font-400 color-[var(--input-dialog-title-color)] flex items-center">
                        <view class="icon-rename scale-90 relative left-[-3px]"></view>
                        <view>{{ $t('bookgroup.dialog.重命名')}}</view>
                    </view>
                    <input type="text" v-model="renameGroupDialogInputVal" focus class="color-[var(--input-input-color)]" placeholder-style="color-[var(-input-input-placeholder-color)]" :placeholder="bookgroup?.name">
                </view>
                <view class="bg-[var(--input-dialog-action-bg)] color-[var(--input-dialog-action-color)] h-[35%] box-border p-[16px] rounded-[0px_0px_8px_8px] bg-[#f0f0f0] flex items-center justify-between gap-[16px]">
                    <view class="flex-grow-1 text-center box-border p-[2px]" @click="handleRenameGroupCancel">{{ $t('dialog.取消') }}</view>
                    <view class="flex-grow-1 text-center box-border p-[2px]" :class="renameGroupDialogInputVal && 'color-[var(--input-dialog-action-active-confirm-color)]'"  @click="handleRenameGroupConfirm">{{ $t('dialog.确认') }}</view>
                </view>
            </view>
        </SelfOverlay>

        <!-- add group dialog -->
        <SelfOverlay v-model="addGroupDialogVisible" :mask="true" position="center" :zindex="10">
            <view class="w-screen m-[48px] rounded-[8px] box-border flex flex-col">
                <view class="bg-[var(--input-dialog-bg)] h-[65%] box-border p-[16px] rounded-t-[8px] color-[#555] flex flex-col justify-between">
                    <view class="title font-400 color-[#0088ff] flex items-center">
                        <view class="icon-group-add scale-80 relative left-[-3px]"></view>
                        <view>{{ $t('group_panel.新建分组')}}</view>
                    </view>
                    <input type="text" focus v-model="addGroupDialogInputVal" class="color-[var(--input-input-color)]" placeholder-style="color-[var(--input-input-placeholder-color)]" :placeholder="$t('group_panel.分组名')">
                </view>
                <view class="bg-[var(--input-dialog-action-bg)] color-[var(--input-dialog-action-color)] h-[35%] box-border p-[16px] rounded-[0px_0px_8px_8px] bg-[#f0f0f0] flex items-center justify-between gap-[16px]">
                    <view class="flex-grow-1 text-center color-[#555] box-border p-[2px]" @click="handleAddGroupCancel">{{ $t('dialog.取消') }}</view>
                    <view class="flex-grow-1 text-center box-border p-[2px]" :class="addGroupDialogInputVal && 'color-[var(--input-dialog-action-active-confirm-color)]'" @click="handleAddGroupConfirm">{{ $t('dialog.确认') }}</view>
                </view>
            </view>
        </SelfOverlay>

        <!-- confirm dialog (delete group, clean group, remove book) -->
        <SelfOverlay v-model="confirmDialogVisible" :mask="true" position="center" :zindex="9999">
            <view class="w-screen m-[48px] rounded-[8px] box-border flex flex-col">
                <view class="bg-[var(--delete-dialog-bg)] h-[65%] box-border p-[16px] rounded-t-[8px] color-[#555] flex flex-col justify-between">
                    <view class="title font-400 flex items-center" :style="{color: dialogConfig[curConfirmDialog].titleFg}">
                        <view class="scale-80 relative left-[-3px]" :class="`${dialogConfig[curConfirmDialog].titleIcon}`"></view>
                        <view>{{ dialogConfig[curConfirmDialog].titleConent }}</view>
                    </view>
                    <view class="text-[14px] color-[var(--delete-dialog-content-color)]">{{ dialogConfig[curConfirmDialog].content }}</view>
                </view>
                <view class="bg-[var(--delete-dialog-action-bg)] color-[var(--delete-dialog-action-color)] h-[35%] box-border p-[16px] rounded-[0px_0px_8px_8px] flex items-center justify-between gap-[16px]">
                    <view class="flex-grow-1 text-center box-border p-[2px]" @click="confirmDialogVisible = false">{{ $t('dialog.取消')}}</view>
                    <view 
                        class="flex-grow-1 text-center box-border p-[2px] color-[darkred]"
                        @click="dialogConfig[curConfirmDialog].confirmCallback"
                        :style="{color: dialogConfig[curConfirmDialog].confirmFg}"
                    >
                        {{ $t('dialog.确认') }}
                    </view>
                </view>
            </view>
        </SelfOverlay>

    </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { BookShelfStore, type Book } from '@/store';
import { onLoad } from '@dcloudio/uni-app';
import { useBookGroup } from './hooks/useBookGroup';

import SelfOverlay from '@/components/self-overlay/self-overlay.vue';
import defaultBookCover from '@/static/default_cover.png';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const isEditing = ref<boolean>(false);
const { bookgroup, groups, selectedGroupBookCounts, isSelectedGropAllBooks, renameGroup, removeGroup, cleanGroup, removeGroupBook, changeBookGroup, moveGroupBookToBookshelf, toggleSelectGroupAllBook, clearGroupBookSelectStates } = useBookGroup();

const actionPanelVisible = ref<boolean>(false);
const editPanelVisible = ref<boolean>(false);   // NOTE 方便有时候在 isEditing 但需要关闭 edit panel 的情况
const groupMgrPanelVisible = ref<boolean>(false);
const renameGroupDialogInputVal = ref<string>('');      
const renameGroupDialogVisible = ref<boolean>(false);
const addGroupDialogInputVal = ref<string>('');
const addGroupDialogVisible = ref<boolean>(false);

const confirmDialogVisible = ref<boolean>(false);
const curConfirmDialog = ref<DialogKinds>('deleteBook');
type DialogKinds = 'cleanGroup' | 'deleteGroup' | 'deleteBook';
type DialogTemplateConfig = Record<DialogKinds, {
    titleFg: string,
    titleIcon: string,
    titleConent: string,
    content: string,
    confirmFg: string,
    confirmCallback: (...args: any[]) => void,
}>
const dialogConfig: DialogTemplateConfig = {
    'cleanGroup': {
        titleFg: 'var(--input-dialog-title-color)',
        titleIcon: 'icon-group-remove',
        titleConent: t('bookgroup.dialog.解散分组'),
        content: t('bookgroup.dialog.分组书籍将移动到书架'),
        confirmFg: 'var(--input-dialog-action-active-confirm-color)',
        confirmCallback: () => { confirmDialogVisible.value = false; cleanGroup(); },
    },
    'deleteGroup': {
        titleFg: 'var(--delete-dialog-title-color)',
        titleIcon: 'icon-group-delete',
        titleConent: t('bookgroup.dialog.删除分组'),
        content: t('bookgroup.dialog.分组与分组内书籍都将被删除！'),
        confirmFg: 'var(--delete-dialog-action-confirm-color)',
        confirmCallback: () => { confirmDialogVisible.value = false; removeGroup(); },
    },
    'deleteBook': {
        titleFg: 'var(--delete-dialog-title-color)',
        titleIcon: 'icon-delete',
        titleConent: t('bookgroup.dialog.删除书籍'),
        content: t('bookgroup.dialog.确认要删除选中书籍吗？'),
        confirmFg: 'var(--delete-dialog-action-confirm-color)',
        confirmCallback: () => { confirmDialogVisible.value = false; removeGroupBook(); },
    }
};

function handleLongPress() {
    if (isEditing.value) {
        return;
    }
    isEditing.value = true;
    editPanelVisible.value = true;
}

function handleNavBack() {
    document.documentElement.classList.add('is-back');
    if (document.startViewTransition) {
        const transition = document.startViewTransition(() => {
            uni.switchTab({ url: '/pages/home/home'});
        });
        
        transition.finished.finally(() => {
            document.documentElement.classList.remove('is-back');
        });
    } else {
        uni.switchTab({ url: '/pages/home/home' });
    }
}

function handleActiveActionPanel() {
    actionPanelVisible.value = true;
}

function handleActionPanelRenameGroup() {
    actionPanelVisible.value = false;

    renameGroupDialogVisible.value = true;
}

function handleActionPanelEditing() {
    actionPanelVisible.value = false;

    isEditing.value = true;
    editPanelVisible.value = true;
}

function handleActionPanelCleanGroup() {
    actionPanelVisible.value = false;

    confirmDialogVisible.value = true;
    curConfirmDialog.value = 'cleanGroup';
}

function handleActionPanelDeleteGroup() {
    actionPanelVisible.value = false;

    confirmDialogVisible.value = true;
    curConfirmDialog.value = 'deleteGroup';
}

function handleEditPanelClose() {
    editPanelVisible.value = false;
    isEditing.value = false;
}

function handleEditPanelToggleSelectAllBooks() {
    toggleSelectGroupAllBook();
}

function handleEditPanelActiveGroupMgrPanel() {
    if (selectedGroupBookCounts.value === 0) {
        return;
    }
    editPanelVisible.value = false;
    groupMgrPanelVisible.value = true;
}

function handleEditPanelCancel() {
    editPanelVisible.value = false;
    isEditing.value = false;
}

function handleEditPanelRemoveBook() {
    if (selectedGroupBookCounts.value === 0) {
        return;
    }
    confirmDialogVisible.value = true;
    curConfirmDialog.value = 'deleteBook';
}

function handleGroupMgrPanelClose() {
    groupMgrPanelVisible.value = false;
    editPanelVisible.value = true;
}

function handleGroupMgrAddGroup() {
    groupMgrPanelVisible.value = false;
    editPanelVisible.value = true;

    addGroupDialogVisible.value = true;
}

function handleGroupMgrMoveBookToBookshelf() {
    // NOTE 不需要 confirm dialog
    moveGroupBookToBookshelf();
    groupMgrPanelVisible.value = false;
    
    isEditing.value = false;
    editPanelVisible.value = false;
}

function handleGroupMgrChangeBookGroup(name: string) {
    // NOTE 不需要 confirm dialog
    changeBookGroup(name);
    groupMgrPanelVisible.value = false;

    isEditing.value = false;
    editPanelVisible.value = false;
}

function handleRenameGroupConfirm() {
    const groupName = renameGroupDialogInputVal.value.trim();
    if (!groupName) {
        return;
    }

    const groups = BookShelfStore.getBookshelf().filter(v => v.type === 'group').map(v => v.name);
    if (groups.includes(groupName)) {
        uni.showToast({ title: `${groupName} ${t('bookgroup.分组已存在')}`, icon: 'none', position: 'top'});
        return;
    }

    renameGroup(groupName);
    renameGroupDialogVisible.value = false;
}

function handleRenameGroupCancel() {
    renameGroupDialogVisible.value = false;
}

function handleAddGroupConfirm() {
    const groupName = addGroupDialogInputVal.value.trim();
    if (!groupName) {
        return;
    }

    const groups = BookShelfStore.getBookshelf().filter(v => v.type === 'group').map(v => v.name);
    if (groups.includes(groupName)) {
        uni.showToast({ title: `${groupName} ${t('bookgroup.分组已存在')}`, icon: 'none', position: 'top'});
        return;
    }

    changeBookGroup(groupName);

    addGroupDialogVisible.value = false;
    addGroupDialogInputVal.value = '';

    isEditing.value = false;
    editPanelVisible.value = false;
}

function handleAddGroupCancel() {
    addGroupDialogVisible.value = false;
    addGroupDialogInputVal.value = '';

    editPanelVisible.value = true;
}

function handleClickBook(book: Book) {
    if (isEditing.value) {
        book.select = !book.select;
        return;
    }

    const key = '_curbook';
    uni.setStorageSync(key, JSON.stringify(book));
    
    const desc = book.progress === 0
        ? `/pages/bookcover/bookcover?data=${key}`
        : `/pages/bookpage/bookpage?data=${key}`;

    if (!document.startViewTransition) {    // NOTE 这个 api 比较新 (v12x)
        uni.navigateTo({url: desc});
        return;
    }

    document.startViewTransition(() => uni.navigateTo({url: desc}));
}

function getBookStatusLable(book: Book) {
    switch (book.status) {
        case '本地':
            return t('book.本地');
        case '完结':
            return t('book.完结');
        case '连载':
            return t('book.连载');
    }
}

function getBookReadProgress(book: Book) {
    // 未读、x章/y章、已读至最新章、已读完
    if (book.progress <= 0) {
        return t('book.未读');
    }

    if (book.progress > 0 && book.progress < book.total) {
        return t('book.chapter_progress', { current: book.progress, total: book.total });
        // return `${book.progress}章/${book.total}章`;
    }

    if (book.progress > 0 && (!book.total || book.total === 0 || book.progress > book.total)) {
        return t('book.chapter_progress', { current: book.progress, total: '?' });
    }

    if (book.status === '连载' && book.progress === book.total) {
        return t('book.已读至最新章');
    }

    if (book.status === '完结' && book.progress === book.total) {
        return t('book.已读完');
    }

}

const bookCoverStyles = computed((): any => { 
    return function(book: Book) {
        const img = book.cover || defaultBookCover;
        return {
            background: `url(${img}), url(${defaultBookCover})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '100% 100%'
        }
    }
});

watch(isEditing, (value) => {
    if (!value) {
        clearGroupBookSelectStates();
    }
})

onLoad((options) => {
    if (options?.data) {
        bookgroup.value = JSON.parse(uni.getStorageSync(options.data));
    }
})
</script>

<style scoped>
.books {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}

/**
 * NOTE
 * - 书籍容器的宽高比是 3.4/2 -> 1.7/1
 * - 封面的宽高比是 3.4*0.75/2 -> 1.275/1
 * - 书籍宽度为容器宽度的 0.28w （简单测试了下，感觉这个值比较好）
 * - height 这里要根据 width 以及对应比例计算，确保响应式
 */
.book-container {
    width: 28vw;
    height: calc(28vw * 3.4 / 2);
    margin-bottom: 18px;
}

.book-container .virtual-cover {
    height: 75%;
}

.bookcover:hover {
    filter: brightness(0.9);
}

/**
 * NOTE
 * - 如果最后一行有两个元素，那么调整最后一个元素的位置（最后一个元素是 last-child，最后一个元素在第 2 列是 3n-1)
 * - 元素整体移动了 一个 vw + 一个 gap。gap = 0.5 * （书架宽度 - 3 * 书籍宽度）
 */
.book-container:last-child:nth-child(3n-1) {
    margin-right: calc(28vw + (100% - 3 * 28vw) * 0.5);
}
</style>
