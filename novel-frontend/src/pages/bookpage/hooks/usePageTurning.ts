import { ref, computed, Ref } from 'vue';
import { useReader } from './useReader';
import { PageTurning, PreferenceStore } from '@/store/preference';
import { Book } from '@/store';

// 动画
// 1. 平移
//      - 检测拖动事件。根据拖动的距离和方向，整体向左或向右平移。
//      - end 回弹效果。
//          - 不翻页回弹。直接平移置 0。
//          - 翻页回弹。先平移置 0，后执行翻页（offset > width * (2/3)）。
// 2. 覆盖
//      - 移动单个页面，页面间有层级关系
//      - 左划移动 prev，prev 在 cur 上层；右划移动 cur，next 在 cur 下层。
// 3. 仿真 /** TODO */
// 4. 上下 /** TODO */
// 5. 无
export function usePageTurning(book: Ref<Book>) {
    // dependencies
    const { goPrevPage, goNextPage, isFirstChapterFirstPage, isLastChapterLastPage } = useReader(book);

    // states
    const pageTurningKinds = ['平移翻页', '覆盖翻页', '无动画'];
    const curPageTurning = ref<'无动画' | '平移翻页' | '覆盖翻页'>('覆盖翻页');
    const startX = ref<number>(0);
    const startY = ref<number>(0);
    const offsetX = ref<number>(0);
    const offsetY = ref<number>(0);
    const isDragging = ref<boolean>(false); // 拖拽动画不需要 transition，用一个全局变量来区分
    let lastMoveTime = 0;
    
    const baseStyles = computed(() => {
        const base = { 'transform': `translateX(${offsetX.value}px)` }
        return isDragging.value ? base : { ...base, 'transition': 'transform 0.3s ease', }
    });
    const coverStyle = computed(() => {
        return {
            'prev': {
                ...baseStyles.value,
                'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.2)',  // 突出覆盖上下层次感
                'z-index': 3,
            },
            'cur': {
                ...baseStyles.value,
                'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.2)',  // 突出覆盖上下层次感
                'z-index': 1,
            },
            'next': {
                'left': 0,
                'z-index': -99, // 左划，next 在 cur 下方，z-index 要低与 cur 的
            }
        }
    });
    const transitionStyle = computed(() => {
        return {
            'prev': {
                ...baseStyles.value,
            },
            'cur': {
                ...baseStyles.value,
            },
            'next': {
                ...baseStyles.value,
            }
        }
    });

    const getPageTurningStyle = computed(() => {
        return (key: 'prev' | 'cur' | 'next') => {
            if (curPageTurning.value === '覆盖翻页') {
                switch (key) {
                    case 'prev':
                        return offsetX.value > 0 ? coverStyle.value[key] : {}; 
                    case 'cur':
                        return offsetX.value < 0 ? coverStyle.value[key] : {};
                    case 'next':
                        return coverStyle.value[key];
                }
            }
            else if (curPageTurning.value === '平移翻页') {
                if (offsetX.value > 0) {
                    return key === 'next' ? {} : transitionStyle.value[key];
                }
                else if (offsetX.value < 0) {
                    return key === 'prev' ? {} : transitionStyle.value[key];
                }
                else {
                    return {};
                }

            }
            else {
                return {};
            }
        }
    });

    // actions
    function initPageTurning() {
        curPageTurning.value = PreferenceStore.getPreference().pageTurning;
    }
    function changePageTurning(style: PageTurning): void {
        curPageTurning.value = style;

        const preference = PreferenceStore.getPreference();
        preference.pageTurning = style;
        PreferenceStore.updatePreference(preference);
    }
    function onTouchStart(event: TouchEvent) {
        isDragging.value = true;
        startX.value = event.touches[0].clientX;
        startY.value = event.touches[0].clientY;
    }

    function onTouchMove(event: TouchEvent) {
        const moveX  = event.touches[0].clientX;
        const moveY = event.touches[0].clientY;

        const _offsetX = moveX - startX.value;
        const _offsetY = moveY - startY.value;

        // NOTE 计算末尾划动速度而不是平均划动速度（有可能用户的手势是先慢后快这种）
        lastMoveTime = Date.now();

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

        offsetX.value = _offsetX;
    }

    function onTouchEnd() {
        const duration = Date.now() - lastMoveTime;
        const finalVelocity = Math.abs(offsetX.value) / duration;
        const isQuickSwipeGesture = Math.abs(offsetX.value) > 10 && finalVelocity > 0.8;
        const isDragGesture = Math.abs(offsetX.value) > uni.getWindowInfo().screenWidth * 0.5;
        const gestureDirection = offsetX.value >= 0 ? 'right' : 'left';
        const updatePage = gestureDirection === 'right' ? goPrevPage : goNextPage;

        if (isQuickSwipeGesture || isDragGesture) {
            offsetX.value = 0;
            isDragging.value = false;
            updatePage();
            return;
        }

        offsetX.value = 0;
        isDragging.value = false;
        return;
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
        getPageTurningStyle,
    };
}
