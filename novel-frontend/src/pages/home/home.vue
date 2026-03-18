<template>
    <view class="bg-[var(--home-bg)] h-screen box-border p-[16px] flex flex-col">
        <view class="bookstack-header color-[var(--home-header-color)] h-[36px] m-b-[16px] flex justify-between items-center">
            <view class="tabs flex items-end">
                <template v-for="(tab, index) in tabs" :key="index">
                    <view class="text-[15px] m-r-[12px] transition-all" @click="curTabIndex = index" :class="{ 'active-tab': curTabIndex === index }">
                        {{ $t(`home.${tab}`) }}
                    </view>
                </template>
            </view>
            <view class="action flex items-center" >
                <transition name="zoom" mode="out-in">
                    <view v-if="!isEditing || !isHistoryEditing" class="manage icon-dots font-[16px]" @click="handleMange"></view>
                    <view v-else-if="isEditing || isHistoryEditing" class="text-[14px]" @click="handleCancelEditing">取消</view>
                </transition>
            </view>
        </view>

        <!-- 
            component 动态组件方案
            - slide 动画不好实现
        -->
        <!-- <view class="bookstack-body flex-grow-1">
            <keep-alive>
                <component :is="tabs[curTab]" v-model:editing="isEditing"/>
            </keep-alive>
        </view> -->


        <!-- 
            swiper uniapp 内置组件方案
            - swiper 需要指定高度（不然应用的就是撑开的高度）
            - swiper 是用了 transform 的，这会导致内部的组件的 overlay 的固定定位失效，定位的位置会从 screen 变成 swiper 容器
                - 解决方案：将 overlay 挂载到 body (h5 -> teleport, mp-wechat -> root-portal)
            - 高度 = 100vh - 上下边距(16) - title高度下边距（36px+16px) - tabbar高度（56px 这里面包含了下边距 16) 
        -->
        <swiper class="bookstack-body flex-grow-1]" :current="curTabIndex" :duration="300" @change="handleTabChange">
            <swiper-item>
                <scroll-view :scroll-y="true" :show-scrollbar="false" class="h-[calc(100vh-16px-36px-16px-56px)]">
                    <BookShelf v-model:editing="isEditing" v-model="editPanelVisible"/>
                </scroll-view>
            </swiper-item>
            <swiper-item>
                <scroll-view :scroll-y="true" :show-scrollbar="false" class="h-[calc(100vh-16px-36px-16px-56px)]">
                    <BookHistory v-model:editing="isHistoryEditing" v-model="historyActionPanelVisible"/>
                </scroll-view>
            </swiper-item>
        </swiper>

        <BookActionPanel v-model="actionPanelVisible" :onActionPanelEditing="handleActionPanelEditing" />
    </view>

    <SelfTabbar />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BookHistory from './components/book-history.vue';
import BookShelf from './components/book-shelf.vue';
import BookActionPanel from './components/book-action-panel.vue';
import { onShow } from '@dcloudio/uni-app';
import SelfTabbar from '@/components/self-tabbar/self-tabbar.vue';

// tabs
const tabs = ['书架', '历史'] as const;
const curTabIndex = ref<number>(0);
function handleTabChange(e: any) {
    curTabIndex.value = e.detail.current;
}

// action menu
const actionPanelVisible = ref<boolean>(false);
const editPanelVisible = ref<boolean>(false);
function handleActionPanelEditing() {
    actionPanelVisible.value = false;
    isEditing.value = true;
    editPanelVisible.value = true;
}
function handleCancelEditing() {
    isEditing.value = isHistoryEditing.value = false;
    editPanelVisible.value = false;
}

const historyActionPanelVisible = ref<boolean>(false);

function handleMange() {
    if (tabs[curTabIndex.value] === '书架') {
        actionPanelVisible.value = !actionPanelVisible.value;
    }
    else {
        historyActionPanelVisible.value = !historyActionPanelVisible.value;
    }
}

// 书籍管理 （书架管理、历史管理）
// - 书籍管理状态要求父子都可以更改，使用 v-model:editing 向子组件传递数据。
// - 为确保在父组件执行取消时执行对应的副作用，子组件在内部通过 watch(isEditing, (value) => if(!value) {}) 进行。
// - 书架与历史要用不同的 editing。用同一个平常可能没问题，但是要是在内部都用这个来管理 overlay，因为 overlay 是全局的就会覆盖
const isEditing = ref<boolean>(false);
const isHistoryEditing = ref<boolean>(false);
watch(curTabIndex, () => {
    // NOTE 切换 tab 时也要清除状态
    isEditing.value = false;
    isHistoryEditing.value = false;
    editPanelVisible.value = false; // NOTE 别忘了
});

onShow(() => uni.hideTabBar());
</script>

<style scoped>
.active-tab {
    font-size: 17px;
    font-weight: bold;
}

.manage {
    transform: rotate(0deg);
    /* NOTE 使用 all 防止意外覆盖其他 manga 身上的动画 */
    transition: all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.manage:hover {
    transform: rotate(180deg);
}
</style>