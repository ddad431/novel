<template>
    <!--
        NOTE
        - 不要将 actionBarVisible 与 onTouchXX 耦合。使用 (e) => actionBarVisible === false ? onTouchStart(e) : () => {} 而不是 onTouchStart
    -->
    <view
        class="w-screen h-screen relative"
        :class="readerThemeClass"
        @touchstart.passive="(e) => actionBarVisible === false ? onTouchStart(e) : () => {}"
        @touchmove.passive="(e) => actionBarVisible === false ? onTouchMove(e) : () => {}"
        @touchend="() => actionBarVisible === false ? onTouchEnd() : () => {}" 
        @touchcancel="() => actionBarVisible === false ? onTouchCancel() : () => {}"
    >
       <!-- reader page -->
       <template v-for="(page, key) in pages" :key>
            <view
                class="page h-full w-full bg-[var(--bookpage-reader-bg)] color-[var(--bookpage-reader-color)]"
                :class="{ 'prev': key === 'prev', 'cur': key === 'cur', 'next': key === 'next'}"
                :style="[
                    getPageTurningStyle(key),
                    {'box-sizing': 'border-box', 'padding': `${READER_LAYOUT.padding}px`}
                ]"
                @click="onPageClick"
            >
                    <!-- Page header  -->
                    <view 
                        class="page-header text-[12px] flex items-center"
                        :style="`height: ${READER_LAYOUT.headerHeight}px; margin-bottom: ${READER_LAYOUT.gap}px`"
                    >
                        <!-- <view class="icon-nav scale-60"></view> -->
                        <view class="title">{{ curPageIndex === 0 ? '' : page.title }}</view>
                    </view>

                    <!-- Page body -->
                    <!-- NOTE loading 禁止 click 事件冒泡。防止在 catalog 已存在，但是用户可能 loading 中又去跳到其他章节。如果其他章节加载的快，那么会先跳到那里，但由于之前请求没有被中断，这会造成过一段时间拿到数据后，chapters 被修改，出现页面跳变 -->
                    <view v-if="state === 'loading'" @click.stop class="page-body w-full flex flex-col gap-[12px] items-center justify-center" :style="`height: calc(100% - ${READER_LAYOUT.headerHeight}px - ${READER_LAYOUT.footerHeight}px - 2*${READER_LAYOUT.gap}px)`">
                        <view class="icon-loading"></view>
                    </view>
                    <view v-else-if="state === 'fail'"  class="page-body w-full flex items-center justify-center" :style="`height: calc(100% - ${READER_LAYOUT.headerHeight}px - ${READER_LAYOUT.footerHeight}px - 2*${READER_LAYOUT.gap}px)`">
                        <view class="flex items-center text" @click.stop="loadingNovelData">
                            <view>获取失败，请点击重试</view>
                        </view>
                    </view>
                    <view v-else-if="state === 'success'" class="page-body w-full" :style="`height: calc(100% - ${READER_LAYOUT.headerHeight}px - ${READER_LAYOUT.footerHeight}px - 2*${READER_LAYOUT.gap}px)`">
                        <template v-for="(line, index) in page.lines" :key="index">
                            <view v-if="line.type === 'title-line'" :style="titleLineStyles">{{ line.text }}</view>
                            <view v-else-if="line.type === 'title-last-line'" :style="titleLastLineStyles">{{ line.text }}</view>
                            <view v-else-if="line.type === 'paragraph-line'" :style="paragraphLineStyles"> {{ line.text }}</view>
                            <view v-else-if="line.type === 'paragraph-last-line'" :style="paragraphLastLineStyles"> {{ line.text }}</view>
                            <view v-else-if="line.type === 'paragraph-compress-line'" :style="paragraphCompressLineStyles"> {{ line.text }}</view>
                        </template>
                    </view>

                    <!-- Page footer -->
                    <view 
                        class="page-footer w-full text-[12px] flex items-cenetr justify-between"
                        :style="`height: ${READER_LAYOUT.footerHeight}px; margin-top: ${READER_LAYOUT.gap}px`"
                    >
                        <view class="left text-[12px] flex gap-2">
                            <view>{{ state === 'success' ? pageProgress(key) : ' '  }}</view>
                            <view>{{ state === 'success' ? chapterProgress(key) : ' ' }}</view>
                        </view>
                        <view class="right flex items-center gap-1.5">
                            <view v-if="isSupportBatteryAPI" class="battery flex items-center">
                                <view :class="batteryStyle" class="scale-120"></view>
                                <view v-if="batteryInfo.isCharging" class="battery-charging scale-70"></view>
                            </view>
                            <view class="time text-[12px]">
                                {{ curTime }}
                            </view>
                        </view>
                    </view>
            </view>
        </template>

        <BottomActionBar
            v-if="catalog"
            v-model:visible="actionBarVisible"
            :curChapterIndex
            :curPageTurning :pageTurningKinds :changePageTurning
            :curReaderTheme :themes  :changeReaderTheme
            :curMode :toggleReaderDarkMode
            :curFontSize :changeFontSize
            :catalog :handleCatalogClick
            :book
        />
     
    
        <Transition name="slide-top">
            <TopActionBar v-show="actionBarVisible" :hideActionBar :book="book!"/>
        </Transition>
        
    </view>
</template>

<script setup lang="ts">
import { ref, toValue } from 'vue';
import { onHide, onLoad, onUnload } from '@dcloudio/uni-app';
import type { Book, Catalog } from '@/store';

import TopActionBar from './components/top-action-bar.vue';
import BottomActionBar from './components/bottom-action-bar.vue';

import { useReader, useReaderTheme, usePageTurning, useActionBar } from './hooks';
import { useTime } from '@/hooks/useTime';
import { useBattery } from '@/hooks/useBattery';
import { useReaderPageConfig } from './hooks/useReaderPageConfig';
import { useBookHisotry } from '../home/hooks';
import { BookHistoryStorage } from '@/store/history';

const book = ref<Book>({} as Book);
const state = ref<'loading' | 'success' | 'fail'>('loading');

const { curTime } = useTime();
const { batteryInfo, batteryStyle, isSupportBatteryAPI } = useBattery();
const { READER_LAYOUT, curFontSize, initFontSize, changeFontSize, titleLineStyles, titleLastLineStyles, paragraphLineStyles, paragraphLastLineStyles, paragraphCompressLineStyles } = useReaderPageConfig();
const { pages, curPageIndex, curChapterIndex, catalog, gotoChapter, isFirstChapterFirstPage, isLastChapterLastPage, initNovelCatalog, initNovelChapters, resetNovelChapters, goPrevPage, goNextPage, pageProgress, chapterProgress } = useReader(book);
const { actionBarVisible, toggleActionBar } = useActionBar();
const { offsetX, curPageTurning, pageTurningKinds, changePageTurning, initPageTurning, onTouchStart, onTouchEnd, onTouchMove, onTouchCancel, getPageTurningStyle } = usePageTurning(book);
const { themes, curReaderTheme, readerThemeClass, initReaderTheme, changeReaderTheme, curMode, toggleReaderDarkMode } = useReaderTheme();

const { bookhistorys } = useBookHisotry();

function initReaderPreference() {
    initFontSize();
    initReaderTheme();
    initPageTurning();
}

function hideActionBar() {
    actionBarVisible.value = false;
}

function onPageClick(e: any): void {
    if (actionBarVisible.value) {
        actionBarVisible.value = false;
        return;
    }

    const width = uni.getWindowInfo().screenWidth;
    const x = e.detail.x;

    if (x < width * (1/3)) {
        if (isFirstChapterFirstPage.value) {
            uni.showToast({ title: '已经是第一页了', icon: 'error', mask: false });
            return;
        }

        // 点击翻页动画（非拖动翻页动画）
        if (curPageTurning.value !== '无动画') {
            offsetX.value = width;
            setTimeout(() => {
                offsetX.value = 0;
                goPrevPage();
            }, 200)
    
            return;
        }
        goPrevPage();
        return;
    }

    if (x > width * (2/3) ) {
        if (isLastChapterLastPage.value) {
            uni.showToast({ title: '已经是最后一页了', icon: 'error', mask: false })
            return;
        }

        // 点击翻页动画（非拖动翻页动画）
        if (curPageTurning.value !== '无动画') {
            offsetX.value = -(width);
            setTimeout(() => {
                offsetX.value = 0;
                goNextPage();
            }, 200)

            return;
        }
        goNextPage();
        return;
    }
   
    toggleActionBar();
}

async function handleCatalogClick(progress: number) {
    state.value = 'loading';
    try {
        await gotoChapter(progress);
        state.value = 'success';
    }
    catch (err) {
        state.value = 'fail';
    }
}

async function loadingNovelData() {
    state.value = 'loading';
    try {
        await initNovelCatalog();
        await initNovelChapters();
        
        state.value = 'success';
    } catch (err) {
        state.value = 'fail';
        console.log('err:', err);
    }
}


onLoad(async (options) => {
    if (!options?.data) {
        throw new Error('加载书籍信息失败');
    }

    book.value = JSON.parse(uni.getStorageSync(options.data));
    if (!book.value) {
        throw new Error('加载书籍信息失败');
    }

    // NOTE 更新历史记录
    book.value.visit = Date.now();
    BookHistoryStorage.addBookHistory(book.value);
    bookhistorys.value = BookHistoryStorage.getBookHistory();

    initReaderPreference();
    
    await loadingNovelData();
});
</script>

<style scoped>
    .prev {
        position: absolute;
        left: -100vw;
    }

    .cur {
        position: absolute;
        left: 0;
    }

    .next {
        position: absolute;
        left: 100vw;
    }
</style>
