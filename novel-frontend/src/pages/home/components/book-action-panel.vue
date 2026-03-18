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
import { Book, BookShelfStore, UploadStore } from '@/store';
import { FileUploader, selectFile } from '@/utils';
import { useBookshelf } from '../hooks';
import SelfOverlay from '@/components/self-overlay/self-overlay.vue';

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
    // #ifdef H5
    try {
        // (1) 获取文件
        const file = await selectFile({count: 1, extension: '.txt'}) as File;

        // (2) 已获取文件，关闭 Addpanel
        actionPanelVisible.value = false;

        // (3) 确认文件是否之前已经上传了
        if (UploadStore.isBookUploaded(file)) {
            uni.showToast({title: '文件已上传', icon: 'error'});
            return;
        }

        // (4) 开始上传。 显示 loading，分片上传（文件分片、并发上传分片、合并分片）
        uni.showLoading({title: '上传中', mask: true});
        const chunks = FileUploader.createChunks(file);
        await FileUploader.uploadChunks(chunks, 'http://localhost:3000/upload');
        const { data } = await FileUploader.mergeChunks(chunks[0].name, 'http://localhost:3000/upload/merge'); // { id, name, author, desc, status }

        // (5) 文件上传成功
        // (5.1) 关闭 loading
        uni.hideLoading();

        // (5.2) 更新本地存储的用户上传记录
        UploadStore.updateBooklUploadRecord(file);

        // (5.3) 更新本地存储的用户书架数据
        const book = { ...data, progress: 0, select: false, isadded: true } as Book;
        BookShelfStore.addBook(book);

        // (5.4) 更新书架 UI（重新读取本地存储的书架数据，更新书架响应式数据）
        const { bookshelf } = useBookshelf();
        bookshelf.value = BookShelfStore.getBookshelf();

        // (5.5) 通知用户上传成功
        uni.showToast({title: '文件上传成功'});
    }
    catch (err) {
        // 出错
        // - 获取文件出错。<- 关闭面板，通知用户
        // - 上传过程中出错。<- 停止 loading（在 loading 前面板已经关闭了，不用考虑面板），通知用户
        console.log(err);

        // @ts-ignore
        if (err?.errMsg?.startsWith('chooseFile:fail')) {
            actionPanelVisible.value = false;
            uni.showToast({title: '选择文件失败', icon: 'error'});
        }
        else {
            uni.hideLoading();
            uni.showToast({title: '文件上传失败', icon: 'error'});
        }
    }
    // #endif

    // #ifdef MP-WEIXIN
    // #endif
}
</script>

<style scoped>
</style>