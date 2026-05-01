<template>
    <view class="bookshelf">
        <template v-for="(bookshelfItem, index) in bookshelf" :key="(bookshelfItem.data as Book).id">
            <view class="book-container flex flex-col justify-between">
                <template v-if="bookshelfItem.type === 'book'">
                    <view 
                        class="relative h-[75%] rounded-[6px]"
                        :class="{
                            'brightness-90': !isDarkMode && bookshelfItem.selected,
                            '!brightness-50': isDarkMode && bookshelfItem.selected,
                            'active:brightness-95': !isDarkMode && !isEditing,
                            '!active:brightness-55': isDarkMode && !isEditing,
                        }"
                        @longpress="handleLongPress"
                        @click="handleClickBook(bookshelfItem)"
                        v-bg-img-lazy="bookshelfItem.data.cover"
                        :style="bookCoverStyles"
                    >
                        <Transition name="zoom">
                            <!-- 书籍状态（完结、连载、本地） -->
                            <view v-if="!isEditing && bookshelfItem.data.status" class="status bg-[var(--bookshelf-cover-status-bg)] color-[--bookshelf-cover-status-color] absolute top-0 right-0 p-[4px_6px] rounded-bl-[6px] rounded-tr-[6px]">
                                <view class="text-[10px]">{{ getBookStatusLable(bookshelfItem.data) }}</view>
                            </view>
                            <!-- 管理书籍 -->
                            <view v-else-if="isEditing" class="select color-[var(--bookshelf-cover-select-color)] absolute right-[3px] bottom-0 ">
                                <view :class="bookshelfItem.selected ? 'icon-selected' : 'icon-unselected'"></view>
                            </view>
                        </Transition>
                    </view>
                    <view class="info flex flex-col">
                        <view class="flex-2 text-[14px] color-[var(--bookshelf-info-color-1)] font-500 truncate flex items-center">
                            <view v-if="bookshelfItem.pinned" class="flex items-center gap-[2px]">
                                <view class="icon-pin"></view>
                                <view class="truncate">{{ bookshelfItem.data.name }}</view>
                            </view>
                            <view v-else class="truncate">{{ bookshelfItem.data.name }}</view>
                        </view>
                        <view class="flex-1 text-[13px] color-[var(--bookshelf-info-color-2)]">{{ getBookReadProgress(bookshelfItem.data) }}</view>
                    </view>
                </template>
                <template v-else>
                    <!--
                        NOTE
                        - padding 与 gap 所占百分比相同
                        - width/height 所占百分比为 50% - gap/2
                    -->
                    <view 
                        class="
                            bookgroup bg-[var(--bookshelf-group-bg-color)] relative h-[75%] rounded-[6px] hover:filter-brightness-95
                            box-border p-[8%] flex flex-wrap gap-[8%]
                        "
                        :class="bookshelfItem.selected ? 'filter-brightness-95' : ''"
                        @longpress="handleLongPress" 
                        @click="handleClickGroup(bookshelfItem)"
                    >
                        <template v-for="(value, index) in bookshelfItem.data"> 
                            <view v-if="index + 1 <= 4" class="relative w-[46%] h-[46%] rounded-[4px]" v-bg-img-lazy="value.cover" :style="bookCoverStyles"></view>
                        </template>

                        <!-- 编辑（选中书籍） -->
                        <Transition name="zoom">
                            <view v-if="isEditing" class="lable-select color-[var(--bookshelf-cover-select-color)] absolute right-[3px] bottom-0">
                                <view :class="bookshelfItem.selected ? 'icon-selected' : 'icon-unselected'"></view>
                            </view>
                        </Transition>
                       
                    </view>
                    <view class="info flex flex-col">
                         <view class="flex-2 text-[14px] color-[var(--bookshelf-info-color-1)] font-500 truncate flex items-center">
                            <view v-if="bookshelfItem.pinned" class="flex items-center gap-[2px]">
                                <view class="icon-pin"></view>
                                <view class="truncate">{{ bookshelfItem.name }}</view>
                            </view>
                            <view v-else class="truncate">{{ bookshelfItem.name }}</view>
                        </view>
                        <view class="flex-1 text-[13px] color-[var(--bookshelf-info-color-2)]">{{ $t('bookshelf.group_book_count', { n: bookshelfItem.data.length }, bookshelfItem.data.length) }}</view>
                    </view>
                </template>
            </view>
        </template>

        <Transition name="fade">
            <view class="book-container" v-if="!isEditing">
                <view class="virtual-cover rounded-[6px]" @click="handleActiveActionPanel"></view>
            </view>
        </Transition>
    </view>

    <!-- action panel -->
    <BookActionPanel v-model="actionPanelVisible"  :onActionPanelEditing="handleActionPanelEditing"/>

    <!-- edit action panel -->
    <SelfOverlay  v-model="editPanelVisible" :mask="false" :teleport="true" :penetrate="true" position="bottom">
        <view class="bg-[var(--action-panel-bg)] color-[var(--action-panel-icon-color)] h-[100px] w-full m-[8px] box-border p-[16px] rounded-[12px]  flex justify-around items-center">
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelToggleSelectAllBook">
                <view :class="[isSelectAllBook ? 'icon-select-all' : 'icon-unselect-all']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ isSelectAllBook ? $t('bookshelf.取消全选') : $t('bookshelf.全选') }}</view>
            </view>
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelTogglePinBook">
                <view class="icon-to-top relative top-[1px]" :class="[seletedBookCounts > 1 || seletedBookCounts === 0 ? 'color-[var(--action-panel-icon-disable-color)]' : '']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]"> {{ isSelectedBookPined ? $t('bookshelf.取消置顶') : $t('bookshelf.置顶') }}</view>
            </view>
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelActiveGroupMgrPanel">
                <view class="icon-move" :class="[seletedBookCounts === 0 || isSelectContainGroup ? 'color-[var(--action-panel-icon-disable-color)]' : '']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookshelf.分组') }}</view>
            </view>
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelCancel">
                <view class="icon-cancel scale-95"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookshelf.取消') }}</view>
            </view>
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelRemoveBook">
                <view class="icon-delete scale-120 color-[darkred]" :class="[seletedBookCounts === 0 ? 'color-[var(--action-panel-icon-disable-color)]' : 'color-[var(--action-panel-delete-color)]']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookshelf.移除') }} {{'(' + seletedBookCounts + ')'}}</view>
            </view>
        </view>
    </SelfOverlay>

    <!-- group manage panel  -->
    <SelfOverlay v-model="groupMgrPanelVisible" :mask="true" position="bottom" :teleport="true" :onClose="handleGroupMgrPanelClose">
        <view class="group-edit-container bg-[var(--group-panel-bg)] text-[15px] font-500 w-full m-[8px] box-border p-[16px] rounded-[12px] flex flex-col gap-[12px]">
            <!-- title -->
            <view class="title h-[24px] color-[var(--group-panel-title-color)]  text-left font-bold">{{ $t('group_panel.分组管理') }}</view>

            <!--
                main （内容列表）
                - action 列表（添加新分组、从分组移出）
                - 分组列表（点击事件，移动到其他分组）
                - 最多显示 6 个条目（1 个 action，5 个分组 | 2 个 action，4 个分组）
                - 最大高度是 6 * 24 + 5 * 12 = 204
            -->
            <view class="main w-full min-h-[60px] max-h-[204px] bg-[var(--group-panel-bg)] flex flex-col gap-[12px] overflow-scroll no-scrollbar">
                <view class="actions color-[var(--group-panel-action-color)] flex flex-col gap-[12px]">
                    <!-- NOTE 书架页没有移除分组 -->
                    <view class="create h-[24px] flex gap-[8px] items-center" @click="handleGroupMgrPanelAddGroup">
                        <view class="icon-group-add scale-80"></view>
                        <view class="">{{ $t('group_panel.新建分组') }}</view>
                    </view>
                </view>
                <view class="groups color-[var(--group-panel-list-color)] flex flex-col gap-[8px]">
                    <view
                        v-for="(value, index) in groups.map(v => v.name)"
                        class="group h-[24px] flex gap-[8px] items-center"
                        :key="index"
                        @click="handleGroupMgrPanelMoveToGroup(value)"
                    >
                        <view class="icon-group scale-80"></view>
                        <view>{{ value }}</view>
                    </view>
                </view>
            </view>
        </view>
    </SelfOverlay>

    <!-- confirm delete dialog -->
    <SelfOverlay v-model="removeBookConfirmDialogVisible" :mask="true" position="center" :teleport="true">
        <view class="w-screen m-[48px] rounded-[8px] box-border flex flex-col">
            <view class="bg-[var(--delete-dialog-bg)] h-[65%] box-border p-[16px] rounded-t-[8px] flex flex-col justify-between">
                <view class="title font-400 color-[var(--delete-dialog-title-color)] flex items-center">
                    <view class="icon-delete scale-80 relative left-[-3px]"></view>
                    <view>{{ $t('bookshelf.删除书籍') }}</view>
                </view>
                <view class="text-[14px] color-[--delete-dialog-content-color]">{{ $t('bookshelf.确认要删除选中书籍吗？') }}</view>
            </view>
            <view class=" bg-[var(--delete-dialog-action-bg)] color-[var(--delete-dialog-action-color)] h-[35%] box-border p-[16px] rounded-[0px_0px_8px_8px] flex items-center justify-between gap-[16px]">
                <view class="flex-grow-1 text-center box-border p-[2px]" @click="handleRemoveBookCancel">取消</view>
                <view class="flex-grow-1 text-center box-border p-[2px] color-[var(--delete-dialog-action-confirm-color)]" @click="handleRemoveBookConfirm">确认</view>
            </view>
        </view>
    </SelfOverlay>

    <!-- add group dialog -->
    <SelfOverlay v-model="addGroupDialogVisible" :mask="true" position="center" :teleport="true" :zindex="10">
        <view class="w-screen m-[48px] rounded-[8px] box-border flex flex-col">
            <view class="bg-[var(--input-dialog-bg)] h-[65%] box-border p-[16px] rounded-t-[8px] color-[#555] flex flex-col justify-between">
                <view class="title font-400 color-[var(--input-dialog-title-color)] flex items-center">
                    <view class="icon-group-add scale-80 relative left-[-3px]"></view>
                    <view>{{ $t('group_panel.新建分组') }}</view>
                </view>
                <input focus v-model="addGroupDialogInputVal" class="color-[var(--input-input-color)]"  placeholder-style="color: var(--input-input-placeholder-color)" :placeholder="$t('group_panel.分组名')">
            </view>
            <view class="bg-[var(--input-dialog-action-bg)] color-[var(--input-dialog-action-color)] h-[35%] box-border p-[16px] rounded-[0px_0px_8px_8px] flex items-center justify-between gap-[16px]">
                <view class="flex-grow-1 text-center box-border p-[2px]" @click="handleAddGroupCancel">{{ $t('dialog.取消') }}</view>
                <view class="flex-grow-1 text-center box-border p-[2px]" :class="addGroupDialogInputVal && 'color-[var(--input-dialog-action-active-confirm-color)]'" @click="handleAddGroupConfirm">{{$t('dialog.确认')}}</view>
            </view>
        </view>
    </SelfOverlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type Book, type BookShelfGroup, type BookShelfBook, BookShelfStore } from '@/store';
import { useBookshelf } from '../hooks';

import defaultBookCover from '@/static/default_cover.png';
import BookActionPanel from './book-action-panel.vue';
import SelfOverlay from '@/components/self-overlay/self-overlay.vue';
import { useI18n } from 'vue-i18n';
import { useProfileStore } from '@/store/profile';

const { t } = useI18n();

const { bookshelf, groups, removeBook, togglePinBook, moveBookToGroup, isSelectAllBook, isSelectedBookPined, isSelectContainGroup, seletedBookCounts, toggleSelectAllBook, clearSelectState } = useBookshelf();
const { isDarkMode } = useProfileStore();

const isEditing = defineModel<boolean>('editing');
const actionPanelVisible = ref<boolean>(false);
const editPanelVisible = defineModel<boolean>({ default: false });  // NOTE 1) 有时候需要在 isEditing 的情况下隐藏 edit panel 2) home 那里也要能控制 panel，所以使用 v-model
const groupMgrPanelVisible = ref<boolean>(false);

const addGroupDialogInputVal = ref<string>('');
const addGroupDialogVisible = ref<boolean>(false);
const removeBookConfirmDialogVisible = ref<boolean>(false);

function handleLongPress() {
    if (isEditing.value) {
        return;
    }
    isEditing.value = !isEditing.value;
    editPanelVisible.value = true;
}

function handleActiveActionPanel() {
    actionPanelVisible.value = true;
}

function handleActionPanelEditing() {
    actionPanelVisible.value = false;

    isEditing.value = true;
    editPanelVisible.value = true;
}

function handleEditPanelToggleSelectAllBook() {
    toggleSelectAllBook();
}

function handleEditPanelTogglePinBook() {
    if (seletedBookCounts.value === 0) {
        return;
    }
    togglePinBook();
    isEditing.value = false;
    editPanelVisible.value = false;
}

function handleEditPanelActiveGroupMgrPanel() {
    if (seletedBookCounts.value === 0 || isSelectContainGroup.value) {
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
    if (seletedBookCounts.value === 0) {
        return;
    }
    removeBookConfirmDialogVisible.value = true;
}

function handleGroupMgrPanelClose() {
    groupMgrPanelVisible.value = false;
    editPanelVisible.value = true;
}

function handleGroupMgrPanelAddGroup() {
    groupMgrPanelVisible.value = false;
    editPanelVisible.value = true;
    addGroupDialogVisible.value = true;
}

function handleGroupMgrPanelMoveToGroup(name: string) {
    moveBookToGroup(name);
    groupMgrPanelVisible.value = false;

    isEditing.value = false;
    editPanelVisible.value = false;
}

function handleRemoveBookConfirm() {
    removeBookConfirmDialogVisible.value = false;
    removeBook();
}

function handleRemoveBookCancel() {
     removeBookConfirmDialogVisible.value = false;
}

function handleAddGroupConfirm() {
    const groupName = addGroupDialogInputVal.value.trim();
    if (!groupName) {
        return;
    }

    const groups = BookShelfStore.getBookshelf().filter(v => v.type === 'group').map(v => v.name);
    if (groups.includes(groupName)) {
        uni.showToast({ title: `${groupName} ${t('bookshelf.分组已存在')}`, icon: 'none', position: 'top'});
        return;
    }

    moveBookToGroup(groupName); 
    addGroupDialogVisible.value = false; 
    addGroupDialogInputVal.value = ''; 

    isEditing.value = false;
    editPanelVisible.value = false;
}

function handleAddGroupCancel() {
    addGroupDialogVisible.value = false; 
    addGroupDialogInputVal.value = ''; 
}

async function handleClickBook(item: BookShelfBook) {
    if (isEditing.value) {
        item.selected = !item.selected;
        return;
    }

    const key = '_curbook';
    const book = item.data;
    uni.setStorageSync(key, book);
    
    const desc = book.progress === 0
        ? `/pages/bookcover/bookcover?data=${key}`
        : `/pages/bookpage/bookpage?data=${key}`;

    if (!document.startViewTransition) {    // NOTE 这个 api 比较新 (v12x)
        uni.navigateTo({url: desc});
        return;
    }

    document.startViewTransition(() => uni.navigateTo({url: desc}));
}

function handleClickGroup(group: BookShelfGroup) {
    if (isEditing.value) {
        group.selected = !group.selected;
        return;
    }

    const key = '_curbookgroup';
    const desc = `/pages/bookgroup/bookgroup?data=${key}`
    uni.setStorageSync(key, JSON.stringify(group));

    if (!document.startViewTransition) {   // NOTE 这个 api 比较新 (v12x)
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

    if ((book.status === '完结' || book.status === '本地') && book.progress === book.total) {
        return t('book.已读完');
    }

}

const bookCoverStyles = {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '100% 100%'
};

watch(isEditing, (value) => {
    // NOTE 每次在取消后清理选中状态
    if (!value) {
        clearSelectState();
    }
})
</script>

<style scoped>
.bookshelf {
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

/**
 * NOTE
 * - 如果最后一行有两个元素，那么调整最后一个元素的位置（最后一个元素是 last-child，最后一个元素在第 2 列是 3n-1)
 * - 元素整体移动了 一个 vw + 一个 gap。gap = 0.5 * （书架宽度 - 3 * 书籍宽度）
 */
.book-container:last-child:nth-child(3n-1) {
    margin-right: calc(28vw + (100% - 3 * 28vw) * 0.5);
}

.virtual-cover {
    box-sizing: border-box;
    background-color: var(--bookshelf-v-cover-bg);
    border: 2px dashed var(--bookshelf-v-cover-border-color);

    /* 控制 after 伪类内容位置（没想到还可以） */
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color .3s;
}

.virtual-cover:after {
    content: '+';
    color: var(--bookshelf-v-cover-center-color);
    font-size: 48px;
    transform: scale(1) rotate(0deg); /* NOTE 在 chromium 系浏览器中必须设置初始状态，不然有时会出现动画遗产 */
    transition: transform .2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.virtual-cover:hover {
    background-color: var(--bookshelf-v-cover-active-bg);
    border-color: var(--bookshelf-v-cover-active-border-color);
}

.virtual-cover:hover::after {
    color: var(--bookshelf-v-cover-active-center-color);
    transform: scale(1.02) rotate(360deg);
}
</style>
