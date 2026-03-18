<template>
        
        
        <!-- 这个 slide-bottom 动画很好 -->
        <!-- <transition name="slide-bottom">
            <view v-if="panelVisible" class="group-edit-container bg-[#f5f5f5] text-[15px] fixed bottom-[8px] left-[8px] right-[8px] box-border p-[16px] rounded-[12px]  flex flex-col gap-[12px]">
                <view class="title h-[24px] color-[#555] text-left">分组管理</view>

                <view class="main w-full min-h-[60px] max-h-[204px] bg-[#f5f5f5] color-[#555] flex flex-col gap-[12px] overflow-scroll no-scrollbar">
                    <view class="actions color-[#0088ff] flex flex-col gap-[12px]">
                        <view class="leave h-[24px] flex gap-[8px]">
                            <view class="icon-group-leave scale-80"></view>
                            <view class="">移出分组</view>
                        </view>
                        <view class="create h-[24px] flex gap-[8px]" @click="addGroupPanelVisible = true; panelVisible = false;">
                            <view class="icon-group-add scale-80"></view>
                            <view class="">新建分组</view>
                        </view>
                    </view>
                    <view class="groups flex flex-col gap-[8px]">
                        <view class="group h-[24px] flex gap-[8px]">
                            <view class="icon-group scale-80"></view>
                            <view>灵异</view>
                        </view>
                        <view class="group h-[24px] flex gap-[8px]">
                            <view class="icon-group scale-80"></view>
                            <view>玄幻</view>
                        </view>
                        <view class="group h-[24px] flex gap-[8px]">
                            <view class="icon-group scale-80"></view>
                            <view>系统</view>
                        </view>
                        <view class="group h-[24px] flex gap-[8px]">
                            <view class="icon-group scale-80"></view>
                            <view>异界</view>
                        </view>
                    </view>
                </view>
            </view>
        </transition> -->

        
        <!-- <view class="fixed top-[100px] w-[200px] h-[100px] bg-red">

        </view> -->

        <view class="h-screen w-screen flex items-center justify-center">
             <SelfLoading text="加载内容中"/>
        </view>
        
</template>

<script setup lang="ts">
import SelfSlider from '@/components/self-slider/self-slider.vue';
import BottomActionBar from '../bookpage/components/bottom-action-bar.vue';
import TopActionBar from '../bookpage/components/top-action-bar.vue';
import { ref } from 'vue';
import Bookhistory from '../bookstack/components/bookhistory.vue';
import SelfOverlay from '@/components/self-overlay/self-overlay.vue';
import SelfTabbar from '@/components/self-tabbar/self-tabbar.vue';
import SelfLoading from '@/components/self-loading/self-loading.vue';

const panelVisible = ref<boolean>(false);
const confirmDialogVisible = ref<boolean>(false);

const value = ref(12);
</script>

<style lang="css" scoped>
    .main {
        /* background-image: url('../../static/test1.png'); */
        background-size: cover;
        /* background: linear-gradient(135deg, #e0e7ff 0%, #fde68a 100%); */
    }
</style>