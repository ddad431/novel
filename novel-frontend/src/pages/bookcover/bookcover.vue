<template>
    <view class="bg-[var(--bookcover-bg)] w-full h-screen box-border flex flex-col gap-[24px] ">

        <!-- 给 header 区域提供模糊背景，模糊背景取自 cover。要注意这里图片要占满，同时层级在最底层以及对应 header 区域背景是透明的-->
        <view class="fixed w-screen h-screen z-0 filter-blur-10" :style="bookCoverStyles(bookinfo)"></view>

        
        <view class="header z-1 color-[var(--bookcover-header-color)]">
            <!-- nav -->
            <view class="nav h-[16px] w-[calc(100vw-32px)] m-[16px] flex justify-between items-center">
                <view class="icon-nav relative left-[-8px]" @click="handleNavBack"></view>
                <view class="icon-dots"></view>
            </view>
            
            <!-- basic -->
            <view class="h-[130px] box-border p-[0_16px] flex gap-[8px] ">
                <view class="bg-[darkred] w-[100px] h-full rounded-[8px]" :style="bookCoverStyles(bookinfo)"></view>
                <view>
                    <view>{{ bookinfo.name }}</view>
                    <view class="text-[14px]">{{ bookinfo.author }}</view>
                </view>
            </view>
        </view>

        <!-- detail -->
        <view class="text-[16px] z-1 flex-grow-1 bg-[var(--bookcover-detail-bg)] box-border p-[16px] p-t-[20px] rounded-t-[0px] flex flex-col gap-[16px]" >
            <view class="h-[24px] flex justify-between items-center">
                <view class="relative p-l-[8px] color-[var(--bookcover-detail-title-color)] before:bg-[var(--bookcover-detail-lable-bg)] before:h-[14px] before:w-[3px] before:rounded-full before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2">{{ $t('bookcover.书源') }}</view>
                <view class="color-[var(--bookcover-detail-content-color)] text-[14px] relative right-[-8px] flex items-center gap-[-4px]">
                    <view class="relative right-[-3px]">{{ bookinfo.source }}</view>
                    <view class="icon-right-arrow scale-80"></view>
                </view>
            </view>
            <view class="h-[24px] flex justify-between items-center">
                <view class="relative p-l-[8px] color-[var(--bookcover-detail-title-color)] before:bg-[var(--bookcover-detail-lable-bg)] before:h-[14px] before:w-[3px] before:rounded-full before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2">{{ $t('bookcover.标签') }}</view>
                <view class="color-[var(--bookcover-detail-content-color)] text-[14px] relative right-[-8px] flex items-center gap-[-4px]">
                    <view class="relative right-[-3px]">{{ bookinfo.tag }}</view>
                    <view class="icon-right-arrow scale-80"></view>
                </view>
            </view>
            <view class="flex flex-col gap-[12px]">
                <view class="relative p-l-[8px] color-[var(--bookcover-detail-title-color)] before:bg-[var(--bookcover-detail-lable-bg)] before:h-[14px] before:w-[3px] before:rounded-full before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2">{{ $t('bookcover.简介') }}</view>
                <view class="line-clamp-5 line-height-[1.6rem] color-[var(--bookcover-detail-content-color)]">{{ bookinfo.desc }}</view>
            </view>
        </view>

        <!-- action -->
         <view class="z-1 bg-[var(--bookcover-action-bg)] fixed bottom-0 w-full h-[64px] box-border p-[12px_16px] flex justify-between items-center text-[15px]">
            <view v-if="bookinfo?.isadded" class="h-full flex gap-[4px] items-center color-[var(--bookcover-action-added-color)]">
                <view class="icon-book-added text-[1.4em]" />
                <view @click="handleAddToBookshelf"><view class="translate-y-[-1.5px]">{{ $t('bookcover.已在书架') }}</view></view>
            </view>
            <view v-else class="h-full flex gap-[4px] items-center color-[var(--bookcover-action-add-color)]">
                <view @click="handleAddToBookshelf"><view class="translate-y-[-1.5px] ">{{ $t('bookcover.加入书架') }}</view></view>
            </view>

            <view class="bg-[var(--bookcover-action-reading-bg)] color-[var(--bookcover-action-reading-color)] w-[50%] h-full rounded-full flex justify-center items-center" @click="handleReading">
                <view class="translate-y-[-1.5px] font-bold">{{ $t('bookcover.开始阅读') }}</view>
            </view>
        </view>
    </view> 
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, getCurrentInstance, ref } from 'vue';
import type { Book, BookShelfBook } from '@/store';
import { BookShelfStore } from '@/store';

import defaultBookCover from '@/static/default_cover.png';
import { useBookHisotry, useBookshelf } from '../home/hooks';
import { BookHistoryStorage } from '@/store/history';

const { bookshelf } = useBookshelf();
const { bookhistorys } = useBookHisotry();

const bookinfo = ref<Book>({} as Book);


function handleNavBack() {
    const pages = getCurrentPages();
    const prevRoute = pages[pages.length - 2]?.route ?? '';
    let navFn;

    // NOTE 强制刷新应用时，此时的 route 就不存在，默认返回 home
    if (!prevRoute) {
        navFn = uni.switchTab({ url: '/pages/home/home'});
    }

    navFn = prevRoute?.includes('home/home')
        ? () => uni.switchTab({ url: '/pages/home/home'}) // NOTE 不能使用 navigateBack 返回 tabBar 页面，只能用 switchTab
        : () => uni.navigateBack();

    if (!document.startViewTransition) {
        navFn();
        return;
    }

    document.documentElement.classList.add('is-back');
    const transition = document.startViewTransition(() => navFn());

    transition.finished.finally(() => {
        document.documentElement.classList.remove('is-back');
    });
}

function handleAddToBookshelf() {
    // NOTE 只允许加入书架，不允许移除书架
    if (bookinfo.value.isadded) {
       return;
    }

    bookinfo.value.visit = Date.now();
    bookinfo.value.isadded = true;
    BookShelfStore.addBook(bookinfo.value);
}

async function handleReading() {
    const key = '_curbook';
    uni.setStorageSync(key, bookinfo.value);

    const desc = `/pages/bookpage/bookpage?data=${key}`;
    if (!document.startViewTransition) {    // NOTE 这个 api 比较新 (v12x)
        uni.navigateTo({url: desc});
        return;
    }
    document.startViewTransition(() => uni.navigateTo({url: desc}));
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

// lifetime
onLoad((options) => {
    if (options?.data) {
        bookinfo.value = uni.getStorageSync(options.data);

        bookinfo.value.visit = Date.now();
        BookHistoryStorage.addBookHistory(bookinfo.value);
        bookhistorys.value = BookHistoryStorage.getBookHistory();
    }
});
</script>

<style scoped>
</style>