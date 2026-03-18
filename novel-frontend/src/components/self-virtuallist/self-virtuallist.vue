<!-- 
    virtual list v1 (不知道什么时候写的...)
    - 思路
        - 可见区域的更新就是通过简单调整视口的 startIdx，即调整可见区域相对于外层整个数据区域的 padding-top。
    - 问题
        - 由于 startIdx 偏移量是基于 滚动距离 / itemHeight 的，这就导致我们的滚动不会出现半个 itemHeight 的情况，
          进而出现滚动时顶部 item 瞬间消失出现的情况
    
    锚点 （点击锚点列表首
    - 锚点显示
        - 当前章不在视口内（即 renderList.map(v => v.index).include(curChaperIndex) === false)
        - 在视口内
    - 点击锚点的行为
        - 点击锚点，renderList 的首 index 为 curChapterIndex
        - 点击锚点这个动作，锚点本身需要动画吗？（scale？）
        - 

    问题
    1. 更新 startIdx 时，Math.ceil 会出现滚动时顶部突然消失的现象
        - 原因：
        - 方案：使用 Math.floor
    2. 更新 endIdx 时，出现滚动时底部突然消失的现象
        - 原因：
        - 方案：endIdx + 1
    3. 点击锚点跳转到当前章时，仅显示部分内容
        - 原因
            - 测试发现： 1）render list data 数据成功更新了 2) 是 render-view 的整个视口上移了
            - 推测：render-view 是在 scroll-view 里的，我们要同步更新 render-view 在 scroll-view 的位置，即更新 scroll-view 的 scrollTop
        - 方案：
            
    TODO
    - 在初次显示虚拟列表时，如果有 curIndex 这种需求，那么虚拟列表的 startIndex 就要为 curIndex
    - 在虚拟列表没有销毁的情况下，每次保留滚动位置（不过销毁的情况下，还需保保留吗？）
-->
<template>
    <scroll-view class="vlist-wrapper" scroll-y="true" :scroll-top="scrollTopVal" :style="`height: ${props.height}px;`" @scroll="handleScroll">
        <view class="scroll-container" :style="`height: ${fullListHeight}px;`">
            <view class="render-container" :style="`padding-top: ${renderListOffsetTop}px`">
                <template v-for="(value, index) in renderListData" :key="index">
                    <slot :data="value"></slot>
                </template>
            </view>
        </view>
     </scroll-view>
    <view v-if="!isCurChapterItemRender" class="anchor absolute bottom-[8px] right-0 bg-white/25 color-dark/80 p-[8px] rounded-[20px] flex justify-center" @click="handleClickAnchor">
        <view class="icon-crosshair"></view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
    curIndex: number,
    data: any[],
    height: number,
    itemHeight: number,
}>();

// scroll-container 滚动条的位置
// - 尽管我们滚动时这个滚动条位置会自动更新，但是我们点击锚点时需要手动更新 scrollTop，因此需要一个变量来控制
const scrollTopVal = ref<number>(0);

const renderListStartIdx = ref<number>(0);

const renderListOffsetTop = computed(() => {
    return renderListStartIdx.value * props.itemHeight;
});
const fullListHeight = computed(() => {
    return props.data.length * props.itemHeight;
});
const renderListCount = computed(() => {
    return Math.floor(props.height / props.itemHeight);
});
const renderListData = computed(() => {
    const endIdx = renderListStartIdx.value + renderListCount.value + 1;
    return props.data.slice(renderListStartIdx.value, endIdx);
});
const isCurChapterItemRender = computed(() => {
    return props.curIndex >= renderListStartIdx.value && props.curIndex <= renderListStartIdx.value + renderListCount.value
});

function updateRenderListStartIdx(scrollTop: number): void  {
    const newStartIdx = Math.floor(scrollTop / props.itemHeight);

    if (newStartIdx !== renderListStartIdx.value) {
        renderListStartIdx.value = newStartIdx;
    }
}

function handleScroll(event: any): void {
    scrollTopVal.value = event.detail.scrollTop;    // NOTE scrollTopVal 要实时同步滚动更改的 scrollTop

    updateRenderListStartIdx(event.detail.scrollTop);
}

function handleClickAnchor() {
    if (isCurChapterItemRender.value) {
        return;
    }
    
    scrollTopVal.value = props.curIndex * props.itemHeight;
    updateRenderListStartIdx(scrollTopVal.value);
}

onMounted(() => {
    // NOTE 每次打开虚拟列表时跳转到 curIndex
    scrollTopVal.value = props.curIndex * props.itemHeight;
    updateRenderListStartIdx(scrollTopVal.value);
})
</script>

<style scoped>
</style>