<template>
    <view 
        :class="['reader-viewport', readerThemeClass, `mode-${curPageTurningMode}`, { 'is-dragging': isDragging }]"
        :style="{ '--offset-x': `${offsetX}px`}"
        @touchstart.passive="handleTouchStart"
        @touchmove.passive="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchCancel"
        :data-direction="gestureDirection"
    >
        <view
            v-for="(page, key) in pages" :key
            :class="['page-slot', key]"
            :style="{'padding': `${READER_LAYOUT.verticalPadding}px ${READER_LAYOUT.horizontalPadding}px` }"
            @click.stop="handlePageClick"
        >
            <!-- Page header  -->
            <view 
                class="page-header text-[12px] flex items-center"
                :style="`height: ${READER_LAYOUT.headerHeight}px; margin-bottom: ${READER_LAYOUT.gap}px`"
            >
                <!-- <view class="icon-nav scale-60"></view> -->

                <view v-if="state === 'success' && isChapterFirstPage" class="title"> {{ key === 'cur' ? '' : page.title }} </view>
                <view v-else-if="state === 'success' && isChapterLastPage" class="title"> {{ key === 'next' ? '' : page.title }} </view>
                <view v-else-if="state === 'success' && curPageIndex === 1" class="title"> {{ key === 'prev' ? '' : page.title }} </view>
                <view v-else-if="state === 'success'"> {{ page.title }}</view>
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
                    <view>{{ state === 'success' ? pageProgress[key] : ' '  }}</view>
                    <view>{{ state === 'success' ? chapterProgress[key] : ' ' }}</view>
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
import { computed, nextTick, ref, } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { Book, Catalog } from '@/store';

import TopActionBar from './components/top-action-bar.vue';
import BottomActionBar from './components/bottom-action-bar.vue';

import { useReader, useReaderTheme, usePageTurning, useActionBar } from './hooks';
import { useTime } from '@/hooks/useTime';
import { useBattery } from '@/hooks/useBattery';
import { useReaderPageConfig } from './hooks/useReaderPageConfig';
import { useBookHisotry } from '../home/hooks';
import { BookHistoryStorage } from '@/store/history';
import { useI18n } from 'vue-i18n';

const book = ref<Book>({} as Book);
const state = ref<'loading' | 'success' | 'fail'>('loading');
const curPageTurningMode = computed(() => {
    switch (curPageTurning.value) {
        case '平移翻页':
            return 'slide';
        case '覆盖翻页':
            return 'cover';
        case '无动画':
            return 'none';
    }
})

const { t } = useI18n();

const { curTime } = useTime();
const { batteryInfo, batteryStyle, isSupportBatteryAPI } = useBattery();
const { READER_LAYOUT, curFontSize, initFontSize, changeFontSize, titleLineStyles, titleLastLineStyles, paragraphLineStyles, paragraphLastLineStyles, paragraphCompressLineStyles } = useReaderPageConfig();
const { pages, curPageIndex, curChapterIndex, catalog, gotoChapter, isChapterFirstPage, isChapterLastPage, isFirstChapterFirstPage, isLastChapterLastPage, initNovelCatalog, initNovelChapters, resetNovelChapters, goPrevPage, goNextPage, pageProgress, chapterProgress } = useReader(book);
const { actionBarVisible, toggleActionBar } = useActionBar();
const { offsetX, isDragging, isAnimation, gestureDirection, curPageTurning, pageTurningKinds, changePageTurning, initPageTurning, onTouchStart, onTouchEnd, onTouchMove, onTouchCancel } = usePageTurning(book);
const { themes, curReaderTheme, readerThemeClass, initReaderTheme, changeReaderTheme, curMode, toggleReaderDarkMode } = useReaderTheme();

const { bookhistorys } = useBookHisotry();

function handleTouchStart(e: any) {
    if (actionBarVisible.value) {
        return;
    }
    onTouchStart(e);
}

function handleTouchMove(e: any) {
    if (actionBarVisible.value) {
        return;
    }
    onTouchMove(e);
}

function handleTouchEnd() {
    if (actionBarVisible.value) {
        return;
    }
    onTouchEnd();
}

function handleTouchCancel() {
    if (actionBarVisible.value) {
        return;
    }
    onTouchCancel();
}

function initReaderPreference() {
    initFontSize();
    initReaderTheme();
    initPageTurning();
}

function hideActionBar() {
    actionBarVisible.value = false;
}

function handlePageClick(e: any): void {
    if (actionBarVisible.value) {
        actionBarVisible.value = false;
        return;
    }

    if (isAnimation.value) {
         return;
    }

    // NOTE 在动画期间不应触发 toggleActionBar, 因此必须先判定 isAnimation
    const screenWidth = uni.getWindowInfo().screenWidth;
    const x = e.detail.x;
    const isNext = x > screenWidth * (2/3)
    if (x >= screenWidth * (1 / 3) && x <= screenWidth * (2 / 3)) {
        toggleActionBar();
        return;
    }

    if (!isNext && isFirstChapterFirstPage.value || isNext && isLastChapterLastPage.value) {
        uni.showToast({ 
            title: isFirstChapterFirstPage.value ? t('bookpage.toast.已经是第一页了') : t('bookpage.toast.没有下一页了'),
            icon: 'none', 
            mask: false 
        });

        return;
    }

    const updatePage = isNext ? goNextPage : goPrevPage;
    if (curPageTurning.value === '无动画') {
        updatePage();
        return;
    }

    // 开启并锁定动画
    isAnimation.value = true;
    isDragging.value = false;

    // 触发动画（设置动画终点）
    offsetX.value = isNext ? -1 * screenWidth : screenWidth;

    // 等待动画结束
    setTimeout(() => {
        isDragging.value = true;    // 关闭动画（防止重置 offsetX 又触发动画）

        offsetX.value = 0;  // 重置 offsetX
        updatePage();       // 更新页面

        isAnimation.value = false; // 关锁

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                isDragging.value = false;
            });
        })
    }, 300)
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
    // TODO 重构。（这个 _curbook key 本来是通过 options 接收的，但是你页面刷新的时候 options 是空的，所以为了防止错误，只能这里先直接硬编码...)
    const data = uni.getStorageSync('_curbook');
    if (!data || Object.keys(data).length === 0) {
        throw new Error('加载书籍信息失败');
    }
    book.value = data;

    // NOTE 更新历史记录
    book.value.visit = Date.now();
    BookHistoryStorage.addBookHistory(book.value);
    bookhistorys.value = BookHistoryStorage.getBookHistory();

    initReaderPreference();
    
    await loadingNovelData();
});
</script>

<style scoped>
.reader-viewport {
    width: 100vw;
    height: 100vh;
    position: relative;
}

.page-slot {
    background-color: var(--bookpage-reader-bg);
    color: var(--bookpage-reader-color);
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    transition: all .3s ease;
    will-change: transform;
}

/* NOTE 通过父容器的 is-dragging 来控制动画开关，这样的好处是只会修改一个元素的样式，浏览会自动应用到子元素 */
.reader-viewport.is-dragging .page-slot {
    transition: none !important;
}

/* NOTE 别忘了无动画要屏蔽 transtion */
.reader-viewport .mode-none .page-slot {
    transition: none !important;
}

/** 拖动时给上层添加阴影，制造层次感 */
.reader-viewport.is-dragging.mode-cover[data-direction="left"] .cur,
.reader-viewport.is-dragging.mode-cover[data-direction="right"] .prev {
    box-shadow: -8px 0 20px rgba(0, 0, 0, 0.15);
}

/**
 * 拖动时给下层添加蒙层，制造层次感
 *
 * NOTE
 * - 借助 after 伪类 + filter 滤镜给页面添加蒙层
 * - 默认情况下不显示（opacity: 0)，当拖动时激活（opacity)
 * - 蒙层与翻页动画同步
 *  - 都是依赖 is-dragging 动态太耐、删除动画
 *  - 动画 duration 相同
 */
 /*
.page-slot::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: transparent;
    backdrop-filter: brightness(0.85);
    -webkit-backdrop-filter: brightness(0.85);
    opacity: 0;
    z-index: 5;
    transition: opacity .3s ease;
}

.reader-viewport.is-dragging .page-slot .next::after,
.reader-viewport.is-dragging .page-slot .cur::after {
    transition: none !important;
}

.reader-viewport.mode-cover[data-direction="left"] .next::after,
.reader-viewport.mode-cover[data-direction="right"] .cur::after {
    opacity: 1;
}
*/

.mode-cover {
    .prev {
        z-index: 3;
        /* NOTE 只有在右滑去上一页，即 offsetX > 0 的情况下，prev 才会动 */
        transform: translateX(calc(-100vw + max(0px, var(--offset-x))));
    }

    .cur {
        z-index: 2;
        /* NOTE 只有在左滑去下一页，即 offsetX < 0 的情况下，cur 才会动 */
        transform: translateX(min(0px, var(--offset-x)));
    }

    .next {
        z-index: 1;
    }
}

.mode-slide {
    .prev {
        left: -100vw;
        transform: translateX(var(--offset-x));
    }

    .cur {
        transform: translateX(var(--offset-x));
    }

    .next {
        left: 100vw;
        transform: translateX(var(--offset-x));
    }
}

.mode-none {
    .prev {
        z-index: -1;
        transform: translateX(calc(-100vw));
    }

    .cur {
        z-index: 3;
        transform: translateX(0px);
    }

    .next {
        z-index: -1;
        transform: translateX(calc(100vw));
    }
}

.page-header,
.page-footer {
    color: var(--bookpage-reader-header-color);
}
</style>