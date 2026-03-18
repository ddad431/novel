<template>
    <view
        class="self-nav"
        :style="`
            padding-top: ${statusBarHeight}px;
            height: ${navBarHeight}px;
            width: ${navBarSafeWidth}px;
        `"
    >
        <slot />
    </view>
</template>

<script setup lang="ts">
const { statusBarHeight } = uni.getWindowInfo();
const { left, top: capsuleTopOffset,  height: capsuleHeight } = uni.getMenuButtonBoundingClientRect();

const navBarHeight = capsuleHeight + (capsuleTopOffset - statusBarHeight) * 2;
const navBarSafeWidth = left;
</script>

<style scoped>
.self-nav {
    display: flex;
    align-items: center;
    /* background-color: pink; */
}
</style>