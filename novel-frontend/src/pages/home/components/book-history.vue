<template>
    <view class="book-history h-full bg-[var(--history-bg)] flex flex-col gap-[16px]">
        <view v-if="showingHistorys.length === 0" class="h-full color-[var(--history-placeholder-color)] flex items-center justify-center relative bottom-[32px] tracking-widest">{{ $t('history.empty_history') }}</view>
        <template v-else v-for="(book, index) in showingHistorys" :key="index" >
            <view class="w-full h-[75px] flex" @click="handleClickHistory(book)" @longpress="handleLongPress">
                <!-- 选择 -->
                <view 
                    class="flex items-center color-[var(--history-select-color)] "
                    :class="[isEditing ? 'w-[20px] opacity-100 p-r-[16px] ' : 'w-[0] opacity-0']" 
                    style="transition: all .2s"
                >
                     <view :class="[book.select ? 'icon-selected' : 'icon-unselected']"></view>
                </view>

                <!-- 信息 -->
                <view class="flex-grow-1 flex gap-[12px]">
                    <view class="w-[60px] h-[75px] rounded-[4px]" :style="bookCoverStyles(book)"></view>
                    <view class="flex flex-col justify-between">
                        <view class="text-[13px] color-[var(--history-info-color-1)]">{{ book.name }}</view>
                        <!-- <view class="text-[14px] line-clamp-2"> {{ book.desc }}</view> -->
                        <view class="flex flex-col gap-[2px]">
                            <view class="color-[var(--history-info-color-2)] text-[12px]">{{ getBookReadProgress(book) }}</view>
                            <!-- TODO: 最近、昨天、三天前、一周前、一月前-->
                            <view class="color-[var(--history-info-color-2)] text-[12px]">{{ getBookVisitTime(book) }}</view>
                        </view>
                    </view>
                </view>
                
                <!-- 
                    NOTE
                    - 这里我们需要在 edit 时让出这部分空间，所以这里涉及到了：shrink-0 min-w-0 overflow-hidden whitespace-nowrap
                -->
                <view 
                    class="shrink-0 min-w-0 overflow-hidden whitespace-nowrap flex justify-end items-center" 
                    :class="[isEditing ? 'translate-x-[100%] w-0 opacity-0' : 'w-[80px]']"
                    style="transition: all .3s;"
                    @click.stop="handleAddBookToBookshelf(book)"
                >
                    <view 
                        class="text-[11px] bg-[var(--history-add-bg)] relative left-[-8px] h-[24px] p-[0_10px] rounded-[20px] flex items-center"
                        :class="[book.isadded ? `color-[var(--history-add-active-color)]` : `color-[var(--history-add-color)]`]"
                    >
                        {{ book.isadded ? $t('history.已在书架') : $t('history.加入书架') }}
                    </view>
                </view> 
            </view>
        </template>
    </view>

    
    <!-- action panel -->
    <SelfOverlay v-model="historyActionPanelVisible" :teleport="true" position="bottom">
        <view class="bg-[var(--action-panel-bg)] color-[--action-panel-icon-color] h-[100px] w-full box-border p-[16px] m-[8px] rounded-[12px] flex justify-around items-center">
            <view class="flex flex-col items-center gap-[8px]" @click="handleActionPanelEditing">
                <view class="icon-edit"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('history.管理') }}</view>
            </view>
            <view class="flex flex-col items-center gap-[8px]" @click="handleActionPanelClearAllHistory">
                <view class="icon-delete scale-120" :class="[bookhistorys.length === 0 ? 'color-[var(--action-panel-icon-disable-color)]' : 'color-[var(--action-panel-delete-color)]']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('history.清空') }}</view>
            </view>
        </view>
    </SelfOverlay>

    <!-- edit panel -->
    <SelfOverlay v-model="isEditing" :mask="false" :teleport="true" :penetrate="true" position="bottom">
        <view class="bg-[var(--action-panel-bg)] color-[--action-panel-icon-color] h-[100px] w-full m-[8px] box-border p-[16px] rounded-[12px] flex justify-around items-center">
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelToggleSelectAllHistory">
                <view :class="[isSelectAllHistory ? 'icon-select-all scale-105' : 'icon-unselect-all scale-100']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]"> {{ isSelectAllHistory ? $t('history.取消全选') : $t('history.全选') }}</view>
            </view>
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelCancel">
                <view class="icon-cancel scale-95"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('history.取消') }}</view>
            </view>
            <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleEditPanelDeleteHistory">
                <view class="icon-delete scale-115 color-[darkred]" :class="[seletedHistoryCounts === 0 ? 'color-[var(--action-panel-icon-disable-color)]' : 'color-[var(--action-panel-delete-color)]']"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('history.移除')}}{{'(' + seletedHistoryCounts + ')'}}</view>
            </view>
        </view>
    </SelfOverlay>

    <!-- delete confirm dialog -->
    <SelfOverlay v-model="confirmDialogVisible" :mask="true" position="center" :teleport="true">
        <view class="w-screen m-[48px] rounded-[8px] box-border flex flex-col">
            <view class="bg-[var(--delete-dialog-bg)] h-[65%] box-border p-[16px] rounded-t-[8px] color-[#555]  flex flex-col justify-between">
                <view class="title font-400 color-[var(--delete-dialog-title-color)] flex items-center">
                    <view class="icon-delete scale-80 relative pos-left-[-3px]"></view>
                    <view>{{ $t(`history.${deleteConfirmDialogConfig[curConfirmKind].title}`) }}</view>
                </view>
                <view class="text-[14px] color-[--delete-dialog-content-color]">{{ $t(`history.${deleteConfirmDialogConfig[curConfirmKind].content}`) }}</view>
            </view>
            <view class="bg-[var(--delete-dialog-action-bg)] color-[var(--delete-dialog-action-color)] h-[35%] box-border p-[16px] rounded-[0px_0px_8px_8px] flex items-center justify-between gap-[16px]">
                <view class="flex-grow-1 text-center box-border p-[2px]" @click="handleDialogCancel">{{ $t('dialog.取消') }}</view>
                <view class="color-[var(--delete-dialog-action-confirm-color)] flex-grow-1 text-center box-border p-[2px]" @click="handleDialogConfirm">{{ $t('dialog.确认') }}</view>
            </view>
        </view>
    </SelfOverlay>
</template>

<script setup lang="ts">
import { BookShelfStore, type Book } from '@/store';
import { useBookHisotry, useBookshelf } from '../hooks';
import { computed, ref, watch } from 'vue';

import defaultBookCover from '../../../static/default_cover.png'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const isEditing = defineModel<boolean>('editing');
const { bookhistorys, removeBookHistory, clearBookHistory, isSelectAllHistory, seletedHistoryCounts, toggleSelectAllHistory, clearSelectState, } = useBookHisotry();
const { bookshelf } = useBookshelf();

const showingHistorys = computed(() => bookhistorys.value.filter(v => v.visit - Date.now() < 30 * 24 * 60 * 60 * 1000));
const historyActionPanelVisible = defineModel<boolean>({ default: false });

const confirmDialogVisible = ref<boolean>(false);
const curConfirmKind = ref<DeleteConfirmKinds>('清空历史');
type DeleteConfirmKinds = '删除历史' | '清空历史';
type DeleteConfirmDialogConfig = Record<DeleteConfirmKinds, {
    title: string,
    content: string,
}>;
const deleteConfirmDialogConfig: DeleteConfirmDialogConfig = {
    '删除历史': {
        title: '删除历史',
        content: '确认要删除选中历史吗？',
    },
    '清空历史': {
        title: '清空历史',
        content: '确认要清空浏览历史吗？'
    }
}

function handleLongPress() {
    if (isEditing.value) {
        return;
    }
    isEditing.value = !isEditing.value;
}

function handleAddBookToBookshelf(book: Book) {
    if (book.isadded) {
        return;
    }
    book.isadded = true;
    BookShelfStore.addBook(book);
    bookshelf.value = BookShelfStore.getBookshelf();
}

function handleClickHistory(book: Book) {
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

function handleActionPanelEditing() {
    historyActionPanelVisible.value = false;
    isEditing.value = true;
}

function handleActionPanelClearAllHistory() {
    if (bookhistorys.value.length === 0) {
        return;
    }
    historyActionPanelVisible.value = false;
    confirmDialogVisible.value = true;
    curConfirmKind.value = '清空历史';
}

function handleEditPanelToggleSelectAllHistory() {
    toggleSelectAllHistory();
}

function handleEditPanelCancel() {
    isEditing.value = false;
}

function handleEditPanelDeleteHistory() {
    if (seletedHistoryCounts.value === 0) {
        return;
    }
    confirmDialogVisible.value = true;
    curConfirmKind.value = '删除历史';
}

function handleDialogConfirm() {
    if (curConfirmKind.value === '删除历史') {
        removeBookHistory();
    }
    else {
        clearBookHistory();
    }
    
    confirmDialogVisible.value = false;
    isEditing.value = false;
}

function handleDialogCancel() {
    confirmDialogVisible.value = false;
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

function getBookVisitTime(book: Book) {
    // 今天看过（小于三天）、昨天看过（大于 1 天小于 2 天）、一周内看过（大于 2 天小于 7 天）、一月内看过（大于 7 天小于 30 天）
    const T_TODAY = 1 * 24 * 60 * 60 * 1000;
    const T_YESTERDAY = 2 * 24 * 60 * 60 * 1000;
    const T_LAST_WEEK = 7 * 24 * 60 * 60 * 1000;
    const T_LAST_MONTH = 30 * 24 * 60 * 60 * 1000;
    const NOW = Date.now();

    const time = (visitTime: number) => {
        const diff = NOW - visitTime;

        if (diff < T_TODAY) {
            return t('history.今天看过');
        } else if (diff < T_YESTERDAY) {
            return t('history.昨天看过');
        } else if (diff < T_LAST_WEEK) {
            return t('history.最近一周看过');
        } else if (diff < T_LAST_MONTH) {
            return t('history.最近一月看过');
        }
    }

    return time(book.visit);
}

// lifetime
watch(isEditing, (value) => {
    // NOTE 每次在取消后清理选中状态
    if (!value) {
        clearSelectState();
    }
})
</script>

<style scoped>
</style>