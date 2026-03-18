<!-- 
    virtual list
    - 要实现的功能
        - 基本虚拟列表
        - 重新打开不应该清除滚动位置（或许需要 keep alive)
        - curIndex 对应的 item 应用自己的 color
        - 点击锚点，返回 curIndex
            1. 返回位置。curIndex 应该是虚拟列可视区的首个 item。
            2. 返回动画。应该有个滚动效果吧。滚动效果主要是缓冲区到可视区这个滚动过程。
    - 基本虚拟列表
        - 滚动区。缓冲区。可视区。
            - 滚动区。itemHeight * itemLength
            - 可视区。
            - 缓冲区。
    - 
    - NOTE
        - 滑动过快留白。
        - 窗口变化。
-->
<template>
    <view class="vlist-container">

    </view>
</template>

<script setup lang="ts">

</script>

<style scoped>

</style>