<template>
    <view 
        class="top-action-bar fixed top-[12px] z-[99]  h-[40px] w-full box-border p-[16px] rounded-[0]  flex justify-between items-center gap-[8px]"
        @click.stop
    >
        <!--
            nav
            - nav 图标浪费了部分左侧空间，使得视觉上 nav 图标距离边界过远。（借助相对定位向左调整）
        -->
        <view class="h-[30px] w-[30px] rounded-full bg-[var(--bookpage-top-bar-bg)] flex items-center justify-center">
            <view class="icon-nav color-[var(--bookpage-top-bar-color)]" @click="handleNavBack"/>
        </view>
        
        <!-- <view class="truncate color-[gray] text-[15px] relative bottom-[1px]">第二十章 哈哈哈哈哈哈哈</view> -->


        <!-- actions -->
        <view class="color-[var(--bookpage-top-bar-color)] flex items-center justify-center rounded-full gap-[8px]">
            <!-- <view class="icon-plus"></view> -->
            <!-- <view v-if="props.book.isadded" class="text-[15px] relative bottom-[1px] color-[gray]">{{ $t('bookpage.已在书架')}}</view>
            <view v-else class="text-[15px] relative bottom-[1px]" @click="handleAddToBookshelf">{{ $t('bookpage.加入书架') }}</view> -->
            <view class="h-[30px] rounded-full bg-[var(--bookpage-top-bar-bg)] flex items-center justify-center box-border" :class="[props.book.isadded ? 'p-[0_12px]' : 'w-[30px]']">
                <!-- <view class="icon-plus color-[gray]"></view> -->
                <view v-if="props.book.isadded" class="text-[13px]">{{ $t('bookpage.已在书架')}}</view>
                <view v-else class="icon-plus" @click="handleAddToBookshelf"></view>
            </view>
            <view class="h-[30px] w-[30px] rounded-full bg-[var(--bookpage-top-bar-bg)] flex items-center justify-center">
                <view class="icon-dots" @click="handleGotoBookcover"></view>
            </view>
        </view> 
    </view>
</template>

<script setup lang="ts">
import { useBookHisotry, useBookshelf } from '@/pages/home/hooks';
import { Book, BookShelfStore } from '@/store';
import { BookHistoryStorage } from '@/store/history';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    hideActionBar: any, // NOTE 返回主页执行的副作用
    book: Book,
}>();

const { t, locale } = useI18n();
const { bookshelf } = useBookshelf();
const { bookhistorys } = useBookHisotry();

function handleNavBack() {
    const pages = getCurrentPages();
    const prevRoute = pages[pages.length - 2]?.route ?? '';
    let navFn;

    // NOTE 强制刷新应用时，此时的 route 就不存在，默认返回 home
    if (!prevRoute) {
        navFn = uni.switchTab({ url: '/pages/home/home'});
    }

    navFn = prevRoute.includes('home/home')
        ? () => uni.switchTab({ url: '/pages/home/home'}) // // NOTE 不能使用 navigateBack 返回 tabBar 页面，只能用 switchTab
        : () => uni.navigateBack();

    if (!document.startViewTransition) {
        navFn();
        return;
    }

    document.documentElement.classList.add('is-back');
    const transition = document.startViewTransition(() => navFn());

    transition.finished.finally(() => {
        document.documentElement.classList.remove('is-back');
    });
}

async function handleGotoBookcover() {
    const key = '_curbook';
    const book = props.book;
    uni.setStorageSync(key, book);

    if (!document.startViewTransition) {    // NOTE 这个 api 比较新 (v12x)
        uni.navigateTo({url: `/pages/bookcover/bookcover?data=${key}`});
        return;
    }

    document.startViewTransition(() => uni.navigateTo({url: `/pages/bookcover/bookcover?data=${key}`}));
}

function handleAddToBookshelf() {
    props.book.isadded = true;
    BookShelfStore.addBook(props.book);
    bookshelf.value = BookShelfStore.getBookshelf();
    
    BookHistoryStorage.addBookHistory(props.book);
    bookhistorys.value = BookHistoryStorage.getBookHistory();

    uni.showToast({ icon: 'none', title: t('bookpage.toast.添加成功') });
}
</script>

<style scoped>

</style>