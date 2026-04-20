<template>
     <!-- #ifdef H5-->
    <view class="bg-[var(--bookcity-bg)] h-[calc(100vh-56px)] box-border p-[16px] p-b-[0] flex flex-col gap-[16px]">
        <view 
            class="search relative bg-[var(--bookcity-search-bg)] h-[40px] box-border p-[0_35px] rounded-[20px] flex items-center"
            :class="[inputFocus && searchHistory.length > 0 ? 'rounded-b-0' : '']"
        >
            <view class="icon-search color-[var(--bookcity-search-icon-color)] scale-70 absolute left-[8px] " />
            <view v-if="inputVal" class="icon-search-clear text-[20px] absolute right-[8px] color-[var(--bookcity-search-icon-color)]" @click="handleClearInput" />
            <input 
                class="color-[var(--bookcity-search-color)] w-full text-[14px]" 
                type="text" 
                v-model="inputVal" 
                :placeholder="$t('bookcity.搜索小说')" 
                :focus="inputFocus" 
                :confirm-hold="true" 
                @confirm="handleInputConfirm(inputVal)" 
                @focus="() => inputFocus = true"
                @blur="handelInputBlur"
            />

            <view 
                v-show="inputFocus && searchHistory.length > 0" 
                class="absolute z-999 w-full top-[40px] left-[0] box-border p-[12px] p-t-[4px] bg-[var(--bookcity-search-bg)] rounded-b-[20px] flex flex-wrap gap-[12px]"
            >
                <!-- 
                    NOTE
                    - 防止过长字符      -> max-w-[100px]
                    - 限制 item 的数量  -> 最多 7 个
                    - 防止点击穿透      -> click.prevent
                    - history panel 显示时，阻止搜索结果列表项的 click 事件

                    TODO
                    - 删除历史该怎么设计（不想用多余的一行来控制删除状态）
                -->
                <view 
                    v-for="(value, index) in searchHistory"
                    class="flex-shrink-0 text-[13px] color-[var(--bookcity-search-history-item-color)] bg-[var(--bookcity-search-history-item-bg)] box-border p-[4px_10px] rounded-full flex items-center gap-[2px]"
                    @click.prevent="handleClickHistory(value)"
                >
                    <text class="max-w-[100px] truncate">{{ value }}</text>
                    <!-- TODO  -->
                    <!-- <text class="icon-cross scale-80"></text> -->
                </view>
            </view>
        </view>
        <scroll-view :scroll-y="true" :show-scrollbar="false" class="h-[calc(100vh-16px-40px-16px-56px)] flex justify-center items-center">
            <view v-if="state === 'empty'" class="color-[var(--bookcity-placeholder-color)] h-full relative bottom-[32px] tracking-widest flex justify-center items-center ">{{ $t('bookcity.empty_search_list') }}</view>
            <view v-if="state === 'loading'" class="color-[var(--bookcity-placeholder-color)] h-full relative bottom-[32px] tracking-widest flex justify-center items-center ">
                <view class="icon-loading"></view>
            </view>
            <view v-else-if="state === 'fail'" class="color-[var(--bookcity-placeholder-color)] h-full relative bottom-[32px] tracking-wide flex justify-center items-center">
                <view class="flex items-center gap-[2px]" @click="handleInputConfirm(inputVal)">
                    <view>{{ $t('bookcity.fail_search') }}</view>
                </view>
            </view>
            <template v-else-if="state === 'success'" v-for="(value, index) in sourceBookList" :key="index" >
                <view class="color-[var(--bookcity-list-color)] h-[100px] m-[16px_0] flex gap-[12px]" :class="[index === 0 ? 'm-t-0' : '']" @click="handleNovelClick(value)">
                    <view class="w-[80px] h-full rounded-[4px]" v-bg-img-lazy="value.cover" :style="bookCoverStyles""></view>
                    <view class="flex-1 info flex flex-col justify-around">
                        <view class="font-500 text-[15px]">{{ value.name }}</view>
                        <view class="text-[14px] line-clamp-2"> {{ value.desc }}</view>
                        <view class="text-[14px] ">{{ value.status && value.status + ' · '}}{{ value.author }}{{ value.tag && ' · ' + value.tag }}</view>
                    </view>
                </view>
            </template>
        </scroll-view>
    </view>
    <!-- #endif -->

    <SelfTabbar />
</template>

<script lang="ts" setup>
import SelfTabbar from '@/components/self-tabbar/self-tabbar.vue';
import { Book, BookShelfStore, Novel } from '@/store';
import { onLaunch, onLoad, onShow } from '@dcloudio/uni-app';
import { computed, nextTick, ref, watch } from 'vue';

import defaultBookCover from '@/static/default_cover.png';
import { fetchNovelList } from '@/services/apis/novel.api';

const inputVal = defineModel<string>({default: ''});
const inputFocus = ref<boolean>(false);
const state = ref<'empty' | 'loading' | 'success' | 'fail'>('empty');

const sourceBookList = ref<Book[]>([]);

const bookCoverStyles = {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '100% 100%'
};

const SEARCH_HISTORY_STORE_KEY = '_searchhistory';
const searchHistory = ref<string[]>([]);
function updateSearchHistory(keyword: string) {
    const set = new Set(searchHistory.value);
    keyword = keyword.trim();

    if (set.has(keyword)) {
        set.delete(keyword);
    }

    const newHistory = [keyword, ...set];
    searchHistory.value = newHistory.slice(0, 7);
    uni.setStorageSync(SEARCH_HISTORY_STORE_KEY, searchHistory.value);
}

function handleClickHistory(keyword: string) {
    inputVal.value = keyword;
    handleInputConfirm(inputVal.value);
}

async function handleInputConfirm(keyword: string) {
    inputFocus.value = false;
   
    if (keyword) {
        try {
            updateSearchHistory(keyword);
            state.value = 'loading';

            const { data } = await fetchNovelList(keyword);
            state.value = 'success';
            sourceBookList.value = (data as Novel[])
                .map(v => ({ ...v, progress: 0, pageProgress: 1, select: false, isadded: false, ispined: false, group: '', total: 0, visit: Date.now() }));

            state.value = 'success';
        }
        catch (err) {
            state.value = 'fail';
            console.error(err);
        }
    }
};

function handleClearInput() {
    inputVal.value = '';
    inputFocus.value = true;
}

function handelInputBlur() {
    // NOTE 延迟失焦事件，确保历史面板的 click 事件触发后，再执行失焦
    setTimeout(() => {
        inputFocus.value = false;
    }, 100);
}

function handleNovelClick(novel: Novel) {
    // NOTE 当历史面板还在时，屏蔽 click 事件，确保 ipnut 的失焦事件触发，关闭历史面板
    if (inputFocus.value) {
        return;
    }

    // NOTE 先检查一下本地有没有保存该书籍信息
    let book: Book | undefined = BookShelfStore.findBook(novel.origin, novel.id)?.data;
    if (!book) {
        book = {...novel, group: '', select: false, isadded: false, ispined: false, progress: 0, pageProgress: 1, visit: Date.now()}
    }

    const key = '_curbook';
    const desc = book.progress === 0 ? `/pages/bookcover/bookcover?data=${key}` : `/pages/bookpage/bookpage?data=${key}`;
    uni.setStorageSync(key, book);

    if (!document.startViewTransition) {
        uni.navigateTo({url: desc});
    }

    document.startViewTransition(() => uni.navigateTo({url: desc}));
}

watch(inputVal, (newVal) => {
    if (state.value === 'fail') {
        state.value = 'empty';
    }
})

onLoad(() => {
    searchHistory.value = uni.getStorageSync(SEARCH_HISTORY_STORE_KEY) ?? [];
})

onShow(() => {
    uni.hideTabBar();
})
</script>