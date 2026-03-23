<template>
    <view class="top-action-bar fixed top-0 h-[48px] w-full box-border p-[16px] bg-[var(--bookpage-top-bar-bg)] color-[var(--bookpage-top-bar-color)] flex justify-between items-center">
        <!--
            nav
            - nav 图标浪费了部分左侧空间，使得视觉上 nav 图标距离边界过远。（借助相对定位向左调整）
        -->
        <view class="icon-nav relative right-[8px]" @click="handleNavBack"/>

        <!-- actions -->
        <view class="flex items-center gap-[16px]">
            <view v-if="props.book.isadded" class="text-[15px] relative bottom-[1px] color-[gray]">已在书架</view>
            <view v-else class="text-[15px] relative bottom-[1px]" @click="handleAddToBookshelf">加入书架</view>
            <view class="icon-dots" @click="handleGotoBookcover"></view>
        </view> 
    </view>
</template>

<script setup lang="ts">
import { useBookshelf } from '@/pages/home/hooks';
import { Book, BookShelfStore } from '@/store';

const props = defineProps<{
    hideActionBar: any, // NOTE 返回主页执行的副作用
    book: Book,
}>();

const { bookshelf } = useBookshelf();

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
    uni.setStorageSync(key, JSON.stringify(book));

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

    uni.showToast({ icon: 'none', title: '添加成功'});
}
</script>

<style scoped>

</style>