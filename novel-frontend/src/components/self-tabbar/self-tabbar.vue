<template>
    <view class="tabbar bg-[var(--tabbar-bg)] fixed bottom-0 w-full h-[56px] flex justify-around items-center">
        <view 
            v-for="(value, key) in tabs" 
            :key
            class="text-[12px]"
            :style="curTab === key ? 'color: var(--tabbar-active-color);' : 'color: var(--tabbar-color)'"
            @click="onClickTab(key, value)"
        >
            <view class="flex flex-col items-center gap-[4px]">
                <view :class="[value.icon, key === '主页' ? 'scale-105' : '', key ==='我的' ? 'scale-115' : '']"></view>
                <!-- <view>{{ key }}</view> -->
            </view>

        </view>
    </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

const tabs = {
    '主页': { path: '/pages/home/home', icon: 'icon-home' },
    '书城': { path: '/pages/bookcity/bookcity', icon: 'icon-library' },
    '我的': { path: '/pages/profile/profile', icon: 'icon-people'},
};
const curTab = ref<string>('');

function initCurTab() {
     const route = '/' + getCurrentPages()[0].route;
     Object.entries(tabs).forEach(([key, value]) => {
        if (value.path === route) {
            curTab.value = key;
        }
     })
}

function onClickTab(key: string, value: {path: string, icon: string}) {
    curTab.value = key;
    uni.switchTab({url: value.path});
}

onShow(() => {
    initCurTab();
})
</script>

<style scoped>

</style>