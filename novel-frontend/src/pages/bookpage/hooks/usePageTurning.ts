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
        if (!isDragging.value || isAnimation.value) {
            return;
        }

        const screenWidth = uni.getWindowInfo().screenWidth;
        const duration = Date.now() - startMoveTime;
        const absX =  Math.abs(offsetX.value);
        const velocity = absX / duration;

        const isQuickSwipeGesture = Math.abs(offsetX.value) > 10 && velocity > 0.5;
        const isDragGesture = Math.abs(offsetX.value) > screenWidth * 0.25;

        const isNext = offsetX.value < 0;
        const updatePage = isNext ? goNextPage : goPrevPage;

        if (isQuickSwipeGesture || isDragGesture) {
            // 开启并锁定动画
            isDragging.value = false;
            isAnimation.value = true;

            // 设置动画结束位置（offsetX 变更，触发动画）
            offsetX.value = isNext ? -1 * screenWidth : screenWidth;   

            // 等待动画完成 (300ms)
            setTimeout(() => {
                isDragging.value = true;    // 关闭动画 (防止 offsetX 重置时再次触发动画)
                offsetX.value = 0;          // 重置 offsetX
                updatePage();               // 更新页面

                isAnimation.value = false;  // 关锁

                // NOTE 这必须要用宏任务等待页面更新完成后再重置，否则 offsetX 重置就会触发动画
                setTimeout(() => {
                    isDragging.value = false;   // 重置拖拽状态（开启动画）
                }, 50);
            }, 300)
        }
        // case 失败回弹
        else if (absX > 5) {
            // 开启并锁定动画
            isDragging.value = false;
            isAnimation.value = true;

            // 设置动画结束位置（回弹动画）
            offsetX.value = 0;

            // 等待动画完成
            setTimeout(() => {
                isAnimation.value = false;  // 关锁

                setTimeout(() => {
                    isDragging.value = false; // 重置拖拽状态（开启动画）
                }, 50);
            }, 300);
        }
        // NOTE
        // - click 事件是在 touchEnd 事件之后才触发的。
        // - 必须要区分失败回弹与点击事件，否则 touchEnd 这里走了失败回弹分支，那么 click 事件会被吞掉。（即 click 事件失效了）
        //  - 为啥会被吞掉？
        //      - 因为这里的回弹动画是 300ms，而 click 的判定事件也恰好是 300ms。如果走了失败回弹的分支，
        //        就会用掉 300ms，300ms 后系统就判定不是 click 事件了。
        //
        // case 点击事件
        else {
            // 重置状态，确保 click 事件正常触发（判断条件通过）
            offsetX.value = 0;
            isDragging.value = false;
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
