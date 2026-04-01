import { nextTick, ref, Ref } from 'vue';
import { useReader } from './useReader';
import { PageTurning, PreferenceStore } from '@/store/preference';
import { Book } from '@/store';

export function usePageTurning(book: Ref<Book>) {
    // dependencies
    const { goPrevPage, goNextPage, isFirstChapterFirstPage, isLastChapterLastPage } = useReader(book);

    // states
    const pageTurningKinds = ['平移翻页', '覆盖翻页', '无动画'];
    const curPageTurning = ref<'无动画' | '平移翻页' | '覆盖翻页'>('覆盖翻页');
    const offsetX = ref<number>(0);
    const offsetY = ref<number>(0);
    const isDragging = ref<boolean>(false); // 拖拽动画不需要 transition，用一个全局变量来区分
    const isAnimation = ref<boolean>(false);
    const gestureDirection = ref<'left' | 'right' | ''>('');

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

        // NOTE 如果是垂直位移大于竖屏位移，则属于上下滑动，对应的不要触发翻页的拖动效果。
        if (Math.abs(_offsetY) > Math.abs(_offsetX)) {
            offsetX.value = 0;
            return;
        }

        if (_offsetX > 0 && isFirstChapterFirstPage.value) {
            uni.showToast({ title: '已经是第一页了', icon: 'error', mask: false });
            return;
        }
        if (_offsetX < 0 && isLastChapterLastPage.value) {
            uni.showToast({ title: '已经是最后一页了', icon: 'error', mask: false });
            return;
        }

        if (!ticking) {
            window.requestAnimationFrame(() => {
                // 只有在拖动状态没结束时才更新
                if (isDragging.value) {
                    offsetX.value = _offsetX;
                    gestureDirection.value = _offsetX > 0 ? 'right' : (_offsetX < 0 ? 'left' : '');
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    function onTouchEnd() {
        if (!isDragging.value) {
            return;
        }

        isDragging.value = false;   // 开启动画
        isAnimation.value = true;   // 开启动画锁定（无论成功还是

        const screenWidth = uni.getWindowInfo().screenWidth;
        const duration = Date.now() - startMoveTime;
        const velocity = Math.abs(offsetX.value) / duration;

        const isQuickSwipeGesture = Math.abs(offsetX.value) > 10 && velocity > 0.5;
        const isDragGesture = Math.abs(offsetX.value) > screenWidth * 0.25;

        const updatePage = gestureDirection.value === 'right' ? goPrevPage : goNextPage;

        if (isQuickSwipeGesture || isDragGesture) {
            offsetX.value = gestureDirection.value === 'left' ? -1 * screenWidth : screenWidth;

            setTimeout(() => {
                offsetX.value = 0;
                isDragging.value = true;
                nextTick(() => {
                    isDragging.value = true;    // NOTE 在页面离开动画完成后（offsetX=0)，就要更新页面，在更新前必须立即关闭动画。（否则更新页面就会被附加动画）
                    updatePage();
                })
            }, 300)
        }
        else {
            offsetX.value = 0;
            
        }

        // 重置状态
        gestureDirection.value = '';
        isDragging.value = false; 
        isAnimation.value = false;
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
