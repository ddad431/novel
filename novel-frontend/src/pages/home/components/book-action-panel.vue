<template>
    <SelfOverlay v-model="actionPanelVisible" :teleport="true" position="bottom">
        <view class="add-panel bg-[var(--action-panel-bg)] color-[var(--action-panel-icon-color)] w-full h-[100px] m-[8px] box-border p-[16px] rounded-[12px] flex items-center justify-around">
            <view class="h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleActiveGroupMgrPanel">
                <view class="icon-edit"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookshelf.管理') }}</view>
            </view>
            <view class="h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleNavToBookcity">
                <view class="icon-library"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookshelf.去书城') }}</view>
            </view>
            <!-- <view class="add-panel-item" >
                    导入书籍</view> -->
            <view class="h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="handleImportBook">
                <view class="icon-import"></view>
                <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookshelf.导入书籍') }}</view>
            </view>
        </view>
    </SelfOverlay>
</template>

<script setup lang="ts">
import { Book, BookShelfStore, catalogStore, chapterStore, UploadStore } from '@/store';
import { FileUploader, selectFile } from '@/utils';
import { useBookshelf } from '../hooks';
import SelfOverlay from '@/components/self-overlay/self-overlay.vue';
import { calcFileHash } from '@/utils/entrypt';
import { _parse } from '@/core/parser';

const { bookshelf } = useBookshelf();

const actionPanelVisible = defineModel<boolean>({ default: false });
const props = defineProps<{
    onActionPanelEditing: (...args: any[]) => void,
}>();

function handleActiveGroupMgrPanel() {
    props.onActionPanelEditing();
}

function handleNavToBookcity() {
    actionPanelVisible.value = false;
    uni.switchTab({ url: '/pages/bookcity/bookcity' });
}

async function handleImportBook() {
    try {
        const file = await selectFile({count: 1, extension: '.txt'}) as File;
        actionPanelVisible.value = false;

        const fileHash = await calcFileHash(file);
        const isUploaded = BookShelfStore.findBook('local', fileHash);
        if (isUploaded) {
            uni.showToast({ title: '书籍已上传', icon: 'none' });
            return;
        }

        uni.showLoading({title: '上传中', mask: true});
        const { meta: book, catalog, chapters } = await _parse(file);
        await catalogStore.set(catalog);
        await chapterStore.setAll(chapters);
        BookShelfStore.addBook(book);
        bookshelf.value.push({ type: 'book', data: book, pinned: false, selected: false });
    }
    catch (err) {
        uni.hideLoading();
        uni.showToast({title: '上传失败', icon: 'error'});
    }
    finally {
        uni.hideLoading();
    }
}
</script>

<style scoped>
</style>