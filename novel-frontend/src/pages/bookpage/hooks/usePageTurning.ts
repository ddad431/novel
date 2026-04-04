import { nextTick, ref, Ref } from 'vue';
import { useReader } from './useReader';
import { PageTurning, PreferenceStore } from '@/store/preference';
import { Book } from '@/store';
import { useI18n } from 'vue-i18n';

export function usePageTurning(book: Ref<Book>) {
    // dependencies
    const { goPrevPage, goNextPage, isFirstChapterFirstPage, isLastChapterLastPage } = useReader(book);
    const { t } = useI18n();

    // states
    const pageTurningKinds = ['平移翻页', '覆盖翻页', '无动画'];
    const curPageTurning = ref<'无动画' | '平移翻页' | '覆盖翻页'>('覆盖翻页');
    const offsetX = ref<number>(0);
    const offsetY = ref<number>(0);
    const isDragging = ref<boolean>(false); // 拖拽动画不需要 transition，用一个全局变量来区分
    const isAnimation = ref<boolean>(false);
    const gestureDirection = ref<'left' | 'right' | ''>('');

    const DRAG_SLOW_RATIO = 0.1;    // 拖动阻尼系数 (用于小说第一章第一页、最后一章最后一页)

    let startX = 0;
    let startY = 0;
    let startMoveTime = 0;
    let ticking = false;
    
    // actions
    function initPageTurning() {
        curPageTurning.value = PreferenceStore.getPreference().pageTurning;
    }
    function changePageTurning(style: string): void {
        isDragging.value = true;    // 关闭动画（尽管我们确保不同 mode 的 cur 位于视图，但由于不同 mode 的页面关系不同，导致触发变更动画）
        offsetX.value = 0;

        // NOTE 需要优化
        const _maps: Record<string, PageTurning> = {
            'Cover': '覆盖翻页',
            'Slide': '平移翻页',
            'None': '无动画',
        };
        
        if (Object.keys(_maps).includes(style)) {
            style = _maps[style];
        }
        curPageTurning.value = style as PageTurning;

        const preference = PreferenceStore.getPreference();
        preference.pageTurning = style as PageTurning;
        PreferenceStore.updatePreference(preference);
    }
    function onTouchStart(event: TouchEvent) {
        if (isAnimation.value) {
            return;
        }

        // NOTE 使用 startMove 计算平均速度而不是 lastMove 计算末尾顺时速度（末尾顺时速度判定会与缓慢拖动相冲突）
        startMoveTime = Date.now();
        isDragging.value = true;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }

    function onTouchMove(event: TouchEvent) {
        if (isAnimation.value || !isDragging.value) {
            return;
        }

        const _offsetX = event.touches[0].clientX - startX;
        const _offsetY = event.touches[0].clientY - startY;
        const isEdge = (_offsetX > 0 && isFirstChapterFirstPage.value)
            || (_offsetX < 0 && isLastChapterLastPage.value);

        // NOTE 如果是垂直位移大于竖屏位移，则属于上下滑动，对应的不要触发翻页的拖动效果。
        if (Math.abs(_offsetY) > Math.abs(_offsetX)) {
            offsetX.value = 0;
            return;
        }

        if (!ticking) {
            window.requestAnimationFrame(() => {
                // 只有在拖动状态没结束时才更新
                if (isDragging.value) {
                    offsetX.value = isEdge ? _offsetX * DRAG_SLOW_RATIO : _offsetX;
                    gestureDirection.value = _offsetX > 0 ? 'right' : (_offsetX < 0 ? 'left' : '');
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    function onTouchEnd() {
        if (!isDragging.value || isAnimation.value) {
            return;
        }

        const screenWidth = uni.getWindowInfo().screenWidth;
        const absX =  Math.abs(offsetX.value);

        // 先判断是否是 click 事件（事件流：touchstart -> touchmove -> touchend -> click)
        if (absX <= 5) {
            // 重置状态，确保 click 事件正常触发（判断条件通过）
            offsetX.value = 0;
            isDragging.value = false;

            return;
        }

        const duration = Date.now() - startMoveTime;
        const velocity = absX / duration;

        const isQuickSwipeGesture = Math.abs(offsetX.value) > 10 && velocity > 0.5;
        const isDragGesture = Math.abs(offsetX.value) > screenWidth * 0.25;

        const isNext = offsetX.value < 0;
        const isEdge = (!isNext && isFirstChapterFirstPage.value)
            || (isNext && isLastChapterLastPage.value);
        const isEnoughOffsetUnderEdge = Math.abs(offsetX.value) > screenWidth * DRAG_SLOW_RATIO * 0.3;
        const updatePage = isNext ? goNextPage : goPrevPage;

        const triggerAnimation: (...args: any[]) => Promise<void> = (state: 'success' | 'fail') => {
            return new Promise((resolve) => {
                // 开启并锁定动画
                isDragging.value = false;
                isAnimation.value = true;

                // 设置动画结束位置（offsetX 变更，触发动画)
                offsetX.value = state === 'fail' 
                    ? 0 
                    : (isNext ? -1 * screenWidth : screenWidth)

                // 等待动画完成 (300ms)
                setTimeout(() => {
                    if (state === 'success') {
                        isDragging.value = true;    // 关闭动画 (防止 offsetX 重置时再次触发动画)
                        offsetX.value = 0;          // 重置 offsetX
                        updatePage();               // 更新页面
                    }
                    isAnimation.value = false;      // 关锁

                    // NOTE 确保当前帧完成后，在下一帧重绘前重置动画状态 (requestAnimationFrame 是在重绘前执行的，所以这里需要嵌套保证当前帧先执行完)
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            isDragging.value = false;   // 重置拖拽状态（开启动画）
                            resolve();
                        })
                    })
                }, 300);
            })
        }

        if (isEdge) {
            triggerAnimation('fail')
                .then(() => {
                    if (isEnoughOffsetUnderEdge) {
                        uni.showToast({ 
                            title: isFirstChapterFirstPage.value ? t('bookpage.toast.已经是第一页了') : t('bookpage.toast.没有下一页了'),
                            icon: 'none', 
                            mask: false 
                        });
                    }
                })
        }
        else if (isQuickSwipeGesture || isDragGesture) {
            triggerAnimation('success');
        }
        else {
            triggerAnimation('fail');
        }
    }

    function onTouchCancel() {
        onTouchEnd();
    }

    return {
        offsetX,
        curPageTurning,
        pageTurningKinds,
        initPageTurning,
        changePageTurning,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
        isDragging,
        isAnimation,
        gestureDirection,
    };
}
