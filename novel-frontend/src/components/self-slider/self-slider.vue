<!-- 
    slider
    - slider 主要有两部分组成：滑块与滑轨。
    - 滑块显示数值，滑动时滑块跟随、数值更新
    - 数值：有范围（min, max)、步长
    - 滑块
        - 有自己的形状（方型、圆角、圆）、高度（宽高一致）、颜色、可以显示数值
        - 滑块相对于滑轨垂直方向是垂直居中的
        - 滑块相对于滑轨在水平方向上是动态的
        - TODO: 鼠标放上去的时候或许需要提供一个 scale 放大效果？
    - 滑轨
        - 有自己的形状（无圆角、圆角、药丸）、高度、
        - 事件
            - 点击任意位置，更新滑轨位置、滑动进度
            - 在滑轨的任一位置开始拖动，立刻更新滑轨位置、滑动进度、数值，之后随拖动同步更新
    - label
        - label 分为左 lable 与 右 lable
        - lable 位置是基于滑轨的
        - lable 的 z-index 小于 thumb 滑块的 z-index，确保滑块能正常覆盖 lable
        - 可以设置 label 的内容、lable 的字体大小。（可能需要扩展到自定义？）
-->
<template>
    <view 
        class="slider-track relative w-full rounded-[10px]"
        :style="trackStyles"
        @click="onClick"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
    >
        <!-- 
            TODO
            - 影响 lable 垂直居中了
            - 在滑块高度小于滑轨高度时，不建议使用 activeBg
            - 有时间了再完善各种滑块样式、滑轨样式的场景 3:47
        -->
        <!-- <view 
            v-if="props.trackActiveBg"
            class="slider-progress absolute z-1 rouded-[8px]"
            :style="trackActiveStyles"
        >
        </view>` -->


        <view
            class="slider-thumb absolute z-3 rounded-[8px] flex justify-center items-center text-[14px]"
            :style="thumbStyles"
        >
            {{  value }}
        </view>

        <view 
            class="left-lable h-full absolute left-[16px] z-2 flex justify-center items-center"
            :style="`font-size: ${props.leftLableSize}px`"
        >
            {{  props.leftLable }}
        </view>

        <view 
            class="right-lable h-full absolute right-[16px] z-2 flex justify-center items-center"
            :style="`font-size: ${props.rightLableSize}px`"
        >
            {{  props.rightLable }}
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, transformVNodeArgs } from 'vue';

interface Props {
    // value
    min?: number,
    max?: number,
    step?: number,
    
    // 滑轨
    trackHeight?: number,
    trackBg?: string,
    trackActiveBg?: string,

    // 滑块
    thumbHeight?: number;
    thumbBg?: string,

    // lable
    leftLable?: string,
    leftLableSize?: number,
    rightLable?: string,
    rightLableSize?: number,
};

interface TrackRectInfo {
    /** 滑轨位置（左边界） */
    left: number,

    /** 滑轨位置（右边界） */
    right: number,

    /** 滑轨宽度 */
    width: number,
};

const value = defineModel<number>({ default: 0 });
const props = withDefaults(defineProps<Props>(), {
    // value
    min: 0,
    max: 100,
    step: 1,

    // 滑轨
    trackHeight: 36,
    trackBg: 'green',
    trackActiveBg: 'red',
    
    // 滑块
    thumbHeight: 32,
    thumbBg: '#f8f8f8',
});
const emit = defineEmits<{
    change: [value: number],    // 暴漏 change 事件，让外部在知道 value 更改后执行一些外部的副作用
}>();
const trackInfo = ref({} as TrackRectInfo); // 滑轨位置、几何信息 (辅助计算 percent)
const thumbPos = ref<number>(0);            // 滑块位置 (绝对定位的 left 值)
let oldValue = value.value;                 // 辅助计算，只有在 value 变化时（相对于 old），才更新滑块位置


const trackStyles = computed(() => {
    return {
        'height': `${props.trackHeight}px`,
        'background-color': `${props.trackBg}`,
    }
});

const trackActiveStyles = computed(() => {
    return {
        'height': `${props.trackHeight}px`,
        'width': `${thumbPos.value + 0.5 * props.thumbHeight}px`,
        'background-color': `${props.trackActiveBg}`,
    }
});

const thumbStyles = computed(() => {
    return {
        'height': `${props.thumbHeight}px`,
        'width': `${props.thumbHeight}px`,
        'top': `${(props.trackHeight - props.thumbHeight) * 0.5}px`,
        'left': `${thumbPos.value}px`,
        'background-color': `${props.thumbBg}`,
    }
});

function calcPercent(x: number): number {
    const trackX = x - trackInfo.value.left;
    const percent = (trackX - 0.5 * props.thumbHeight) / trackInfo.value.width;
    
    return percent;
}

// 问题
// 1. 手机模式好像超出边界 onClick 事件也会触发？
// 2. 点击靠近边缘位置，滑块移动超出边界
// 3. 处理 ThumbPos 超出边界时，也要及时更新 value
// 4. 只在 value 更新时才更新滑块位置
// 5. 只在 value 更新的符合步长时才更新滑块位置
// 6. 初始的 v-model 没有同步滑块位置
// 7. 滑动一段距离，然后关闭 panel，滑块位置重置了，但是值没有重置。（应该是滑块位置不要重置）
function updateValueAndThumbPos(x: number) {
    const percent = calcPercent(x);

    // 边界情况
    const lbound = 0.5 * props.thumbHeight;
    const rbound = trackInfo.value.width - props.thumbHeight;
    let newThumbPos = trackInfo.value.width * percent;
    let newValue = props.min + Math.ceil((props.max - props.min) * percent);
   
    if (newThumbPos <= lbound) {
        newThumbPos = 0;
        newValue = props.min;
    }
    else if (newThumbPos >= rbound) {
        newThumbPos = rbound;
        newValue = props.max;
    }

    // 只有在 value 更新且 value 的更新大小为步长大小时才更新滑块的位置
    if (newValue !== oldValue && Math.abs(newValue - oldValue) % props.step === 0) {
        thumbPos.value = newThumbPos;
        value.value = newValue;
        oldValue = newValue;
        emit('change', newValue);
    }
}

function onClick(e: any) {
    updateValueAndThumbPos(e.detail.x);
}
function onTouchStart(e: TouchEvent) {
    updateValueAndThumbPos(e.touches[0].pageX);
}
function onTouchMove(e: TouchEvent) {
    updateValueAndThumbPos(e.touches[0].pageX); 
}

async function getTrackInfo() {
    return new Promise<void>((resolve) => {
        uni.createSelectorQuery()
            .select('.slider-track')
            .boundingClientRect((data) => {
                const rect = data as UniApp.NodeInfo;
                trackInfo.value = {
                    left: rect.left!,
                    right: rect.right!,
                    width: rect.width!,
                }
                resolve();
            })
            .exec()
    })
}

function initThumbPos() {
    const percent = (value.value - props.min) / (props.max - props.min);
    const newThumbPos = trackInfo.value.width * percent;

    thumbPos.value = newThumbPos > trackInfo.value.width - props.thumbHeight
        ? trackInfo.value.width - props.thumbHeight
        : newThumbPos;
}

async function init() {
    await getTrackInfo();
    initThumbPos();
}

onMounted(async () => {
    init();
})
</script>

<style scoped>
</style>