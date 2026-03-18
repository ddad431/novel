<!-- 
    overlay
    - overly 由遮罩以及内容 wrapper 两部分组成。遮罩提供全屏蒙层，点击内容外区域自动关闭功能；wrapper 用来辅助调整内容区块的位置
    - 遮罩
        - 遮罩有两种 1）没有蒙层（透明） 2) 有蒙层
        - 遮罩实现
            - 遮罩其实就是铺满全屏的顶层图层（这里使用 fixed 绝对定位，防止其他元素干扰）
            - 没有蒙层就是透明 'transparent'，有蒙层就加个透明度就好
        - 遮罩行为
            - 点击非内容区域，会关闭整个 overlay
            - 对于内容区域，阻止点击/tap 冒泡
        - 遮罩层级
            - 有时候我们需要覆盖遮罩的 offset 区域（例如小说的 bottom-action-bar 的 panel 借助 overlay 弹出的的话，遮罩的层级必须低于 bottom-action-bar 的)
                - 对外暴露一个 zindex props, 外部不需要知道内部 props 值，只需要选择性的调低就可以
    - 内容 wrapper
        - 在水平方向居中 <- 由 wrapper 控制 (justify-center)
        - 垂直方向有三个选择 top, center, bottom
            - 默认是 center <- 由遮罩控制 (items-center)
            - top, bottom <- 由 wrapper 相对于遮罩绝对定位控制（尽管遮罩可以借助 items-xx 控制，但是这样无法设置 top offset/bottom offset）
    - 动画
        - 是嵌套动画
        - 三种动画（top -> 顶部划入, bottom -> 底部划入, center -> 缩放)
        - 子元素的动画效果可能受父元素动画的影响（叠加效果）
            - 解决：延迟父元素动画的触发时间，等子元素动画触发后再触发
    - NOTE
        - 固定定位 (fixed) 会在父容器应用 translate 等情况下失效，即相对于父容器而不是视口
            - 解决方案：整个 overlay 挂载在 body 上 （uniapp h5 使用 teleport，MP-WEIXIN 使用 root-portal）
        - 将 overly 挂载 body 有缺点。如果你那个 overlay 在某个 dom 下（例如阅读器），需要覆盖全局的样式，这样你挂载到 body 下，这个覆盖就会失效
            - 解决方案：添加一个 teleport 开关。（默认是 false）
        - 有时我们希望在 mask=false 的情况下忽略 mask 的点击事件，即正常触发遮罩下方内容的点击事件
            - 解决方案：屏蔽 mask 的点击事件 (pointer-events: none)，暴漏一个提供一个穿透 props 供用户调整
                - 问题：好像连 wrapper 的点击事件也屏蔽了，父树的点击事件屏蔽后，子树也会同步屏蔽
                    - 解决：强制启用子树的点击事件 pointer-events: auto
-->
<template>
    <transition v-if="!props.teleport" name="overlay">
        <view
            v-if="visible"
            class="mask fixed left-0 top-0 z-1000 w-screen h-screen flex justify-center items-center"
            :style="maskStyles"
            @click="onClose"
        >
            <view
                v-if="visible"
                class="wrapper w-full flex justify-center z-999"
                :class="[props.position === 'bottom' ? 'bottom' : props.position === 'top' ? 'top' : 'center']"
                style="pointer-events: auto;"
                :style="topOrBottomStyles"
                @click.stop
            >
                <slot></slot>
            </view>
        </view>
    </transition>
  
    <!-- #ifdef H5 -->
     <teleport v-else to="body">
        <transition name="overlay">
            <view
                v-if="visible"
                class="mask fixed left-0 top-0 z-1000 w-screen h-screen flex justify-center items-center"
                :style="maskStyles"
                @click.stop="onClose"
            >
                <view
                    v-if="visible"
                    class="wrapper w-full flex justify-center z-999"
                    :class="[props.position === 'bottom' ? 'bottom' : props.position === 'top' ? 'top' : 'center']"
                    style="pointer-events: auto;"
                    :style="topOrBottomStyles"
                    @click.stop
                >
                    <slot></slot>
                </view>
            </view>
        </transition>
    </teleport>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <root-portal v-else>
        <transition name="overlay">
            <view
                v-if="visible"
                class="mask fixed left-0 top-0 z-1000 w-screen h-screen flex justify-center items-center"
                style="pointer-events: auto;"
                :style="maskStyles"
                @click.stop="onClose"
            >
                <view
                    v-if="visible"
                    class="wrapper w-full flex justify-center z-999"
                    :class="[props.position === 'bottom' ? 'bottom' : props.position === 'top' ? 'top' : 'center']"
                    :style="topOrBottomStyles"
                    @click.stop
                >
                    <slot></slot>
                </view>
            </view>
        </transition>
    </root-portal>
    <!-- #endif -->

</template>

<script setup lang="ts">
import { computed, CSSProperties } from 'vue';

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(defineProps<{
    mask?: boolean,
    position?: 'top' | 'center' | 'bottom',
    offsetBottom?: string,
    offsetTop?: string,
    zindex?: number,        // NOTE 需要覆盖遮罩层 offset 的场景。调用方不需要知道遮罩的层级值，只需要调低即可
    onClose?: () => void,     // NOTE 覆盖 close 原始行为。方便执行外部副作用
    teleport?: boolean,     // NOTE 挂载到 body。 （当父容器为 transform, ... 时，定位可能失效，即定位相对的不是视口而是父容器）
    penetrate?: boolean,    // NOTE 允许点击事件穿透，即忽略 mask 的点击事件，正常触发下方内容的点击事件
}>(), {
    mask: true,
    position: 'center',
    zindex: 1000,
    teleport: false,
    penetrate: false,
});

function onClose() {
    if (!props?.onClose) {
        visible.value = false;
        return;
    }

    // 外部自行处理，方便执行副作用
    props.onClose();
}

const maskStyles = computed((): CSSProperties => {
    return {
        'background-color': props.mask ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
        'z-index': props.zindex,
        'pointer-events': props.penetrate ? 'none' : 'auto', // 是否允许穿透，忽略 mask 的点击事件
    }
})

const topOrBottomStyles = computed((): CSSProperties => {
    switch (props.position) {
        case 'top':
            return {
                position: 'absolute',
                top: props.offsetTop ?? '0px',
            };
        case 'bottom':
            return {
                position: 'absolute',
                bottom: props.offsetBottom ?? '0px',
            };
        case 'center':
            return {} 
    }
});
</script>

<style scoped>
/**
 * NOTE
 * - 这是一个嵌套动画。蒙层是 fade-in/out 淡入淡出效果，内部的 wrapper 是 slide-in-up/slide-out-down 效果
 * - vue 嵌套的动画的文档见：https://cn.vuejs.org/guide/built-ins/transition.html#nested-transitions-and-explicit-transition-durations
 * - 有一个注意点：这里嵌套动画默认是叠加的。如果不想子动画叠加父动画，可以在延迟父动画触发，等子动画触发完后，再触发父动画
 */
.overlay-enter-from {
    opacity: 0;
}
.overlay-enter-to {
    opacity: 1;
}
.overlay-leave-from {
  opacity: 1;
}
.overlay-leave-to {
  opacity: 0;
}
.overlay-enter-active {
  transition: opacity .2s linear;
}
.overlay-leave-active {
    /* NOTE 父元素动画在子元素动画执行完后触发，防止子元素应用上父元素的 fade 效果 */
    transition: opacity .2s linear;
    transition-delay: .2s; /* 等待子元素动画完成 */
}

.overlay-enter-from .bottom {
    transform: translateY(100%);
}
.overlay-enter-to .bottom {
    transform: translateY(0);
}
.overlay-leave-from .bottom {
    transform: translateY(0);
}
.overlay-leave-to .bottom {
    transform: translateY(100%);
}
.overlay-enter-active .bottom {
    transition: transform .4s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.overlay-leave-active .bottom {
    transition: transform .3s cubic-bezier(0, 1.23, 1, 0.98);
}

.overlay-enter-from .top {
    transform: translateY(-100%);
}
.overlay-enter-to .top {
    transform: translateY(0);
}
.overlay-leave-from .top {
    transform: translateY(0);
}
.overlay-leave-to .top {
    transform: translateY(-100%);
}
.overlay-enter-active .top {
  transition: transform .3s ease-in-out; 
}
.overlay-leave-active .top {
  transition: transform .2s ease-in-out;
}

.overlay-enter-from .center {
    scale: 0;
    
}
.overlay-enter-to .center {
    scale: 1;
   
}
.overlay-leave-from .center {
    scale: 1;
   
}
.overlay-leave-to .center {
    scale: 0;
    
}
.overlay-enter-active .center {
    transition: scale .3s ease;
}
.overlay-leave-active .center {
  transition: scale .2s ease; 
}
</style>