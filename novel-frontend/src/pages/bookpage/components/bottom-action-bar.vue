 <template>
    <!-- NOTE bottom-action-bar 的 z-index 必须高于 overlay，否则会被蒙层遮挡 -->
    <!-- <Transition name="slide-bottom">
        <view
            v-show="actionBarVisible"
            class="bg-[var(--bookpage-bottom-bar-bg)] color-[var(--bookpage-bottom-bar-color)] fixed bottom-0 z-9999 w-screen h-[72px]  box-border p-[16px] flex items-center transition-colors"
            @click.stop
        >
            <view class="h-full w-full flex items-center justify-around ">
                <view :class="[chapterlistPanelVisible === true ? 'icon-list-actived' : 'icon-list']" @click.stop="toggleChapterListPanel"></view>
                <view :class="[props.curMode === 'dark' ? 'icon-sun' : 'icon-moon']" @click="toggleLightDarkMode"></view>
                <view :class="[preferencePanelVisible === true ? 'icon-adjustment-actived' : 'icon-adjustment']" @click.stop="togglePreferencePanel"></view>
            </view>
        </view>
     </Transition> -->

       
    <view         
        class="bottom-action-bar fixed bottom-[8px] z-9999 h-[100px] w-[calc(100vw-16px)] m-l-[8px] box-border p-[16px] rounded-[12px] flex justify-around items-center"
        :class="[actionBarVisible ? '' : 'bottom-action-bar-hidden']"
    >
        <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="toggleChapterListPanel">
            <view class="icon-list"></view>
            <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookpage.bottom.目录') }}</view>
        </view>
        <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="toggleLightDarkMode">
            <view :class="[props.curMode === 'dark' ? 'icon-moon' : 'icon-sun']"></view>
            <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ props.curMode === 'dark' ? $t('bookpage.bottom.夜晚') : $t('bookpage.bottom.白天') }}</view>
        </view>
        <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="togglePreferencePanel">
            <view class="icon-adjustment"></view>
            <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookpage.bottom.偏好') }}</view>
        </view>
    </view>
 
    <self-overlay v-model="preferencePanelVisible" :mask="false" position="bottom">
        <view 
            class="bg-[var(--bookpage-bottom-preference-bg)] color-[var(--bookpage-bottom-preference-color)] w-full m-[8px] box-border p-[24px] rounded-[16px]"
            @touchmove.stop
        >
		
            <view class="preference-font w-full m-b-[16px]">
                <SelfSlider 
                    class="preference-font"
                    v-model="fontSize"
                    @change="props.changeFontSize"
                    :trackHeight="46"
                    trackBg="var(--bookpage-bottom-preference-item-bg)"
                    :thumbHeight="36"
                    thumbBg="var(--bookpage-bottom-preference-item-active-bg)"
                    :min="12"
                    :max="36"
                    :step="2"
                    :left-lable="'A'"
                    :right-lable="'A'"
                    :left-lable-size="14"
                    :right-lable-size="24"
                />
            </view>
          
            <view class="preference-theme h-[60px] w-full  m-b-[16px] flex items-center justify-between">
                <view
                    v-for="(value, key) in props.themes" :key
                    class="w-[44px] h-[44px] rounded-full"
                    :class="props.curReaderTheme === key ? 'preference-theme-active' : ''"
                    :style="`background-color: ${value}`"
                    @click="props.changeReaderTheme(key)"
                >
                </view>
            </view>

            <view class="flex flex-col gap-[16px] m-b-[20px]">
                <view class="turing h-[36px] flex items-center text-[14px]">
                    <view class="w-[80%]">{{ $t('bookpage.bottom.翻页方式') }}</view>
                    <view class="preference-turing w-full">
                        <self-segmented
                            v-model="pageTurning"
                            @change="props.changePageTurning"
                            :options="props.pageTurningKinds.map(v => $t(`bookpage.${v}`))"
                            height="36px" 
                            bg="var(--bookpage-bottom-preference-item-bg)" 
                            active-bg="var(--bookpage-bottom-preference-item-active-bg)"  
                        />
                    </view>
                </view>
            </view>

            <view class="preference-more text-[14px] flex justify-between">
                <view>{{ $t('bookpage.bottom.更多设置') }}</view>
                <view class="icon-next"></view>
            </view>
        </view>
    </self-overlay>

    <self-overlay v-model="chapterlistPanelVisible" position="bottom">
        <view class="book-info bg-[var(--bookpage-bottom-chapterlist-bg)] color-[var(--bookpage-bottom-chapterlist-color)] m-[8px] min-w-0 w-full box-border p-[24px] p-b-[8px] rounded-[16px] flex flex-col justify-between" @touchmove.stop>
            <view class="book-meta h-[90px] m-b-[16px] flex gap-[12px]">
                <view class="cover h-[90px] w-[70px] rounded-[4px]" :style="bookCoverStyles(props.book)"></view>
                <view class="info flex-grow flex flex-col justify-between" >
                    <view class="w-full h-[60px]">
                        <view class="text-[17px]">{{ props.book.name }}</view>
                        <view class="text-[15px]">{{ props.book.author }}</view>
                    </view>
                    <view class="w-full flex justify-between text-[13px]">
                        <view v-if="props.book.status">{{ `共 ${book.total} 章` + props.book.status && props.book.status }}</view>
                        <view v-else>{{  `共 ${book.total} 章`}}</view>
                        <!-- TODO 倒序 -->
                        <view @click="isReverseChapterList = !isReverseChapterList">{{ !isReverseChapterList ? '倒序' : '正序'}}</view>
                    </view>
                </view>
            </view>

            <view class="book-chapter flex-grow">
                <self-virtuallist 
                    :reverse="isReverseChapterList" 
                    :data="catalogs"
                    :height="300" 
                    :itemHeight="30" 
                    :curIndex="props.curChapterIndex"
                    :anchorBg="props.curMode === 'light' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'"
                    :anchorColor="props.curMode === 'light' ? '' : ''"
                >
                    <template #default="{ data }">
                        <div class="h-[30px] truncate text-[14px]" :style="data.index === props.curChapterIndex ? 'color: var(--bookpage-bottom-chapterlist-active-color); font-weight: bold;' : ''" @click="handleCatalogClick(data.index + 1)"> {{ data.title }}</div>
                    </template>
                </self-virtuallist>
                <!-- <view class="jumpto absolute bottom-[8px] right-0 bg-white/25 color-dark/80 p-[8px] rounded-[20px] flex justify-center">
                    <view class="icon-crosshair"></view>
                </view> -->
            </view>
        </view>
    </self-overlay>
</template>

<script setup lang="ts">
import SelfSlider from '@/components/self-slider/self-slider.vue';
import { Book, Catalog } from '@/store';
import { PageTurning, ReaderTheme } from '@/store/preference';
import { computed, onMounted, ref } from 'vue';
import { useReader } from '../hooks';

import defaultBookCover from '@/static/default_cover.png';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
    // page
    curChapterIndex: number,

    // page turning
    curPageTurning: PageTurning,
    pageTurningKinds: string[],
    changePageTurning: (value: string) => void,

    // reader theme
    themes: Record<ReaderTheme, string>,
    curReaderTheme: ReaderTheme,
    changeReaderTheme: (value: ReaderTheme) => void,

    // dark mode
    curMode: 'light' | 'dark', 
    toggleReaderDarkMode: () => void,

    // font size
    curFontSize: number,
    changeFontSize: (value: number) => void,

    // book
    book: Book,

    // catalog
    catalog: Catalog,
    handleCatalogClick: (value: number) => void,
};

const actionBarVisible = defineModel('visible');
const props = defineProps<Props>();

function handleCatalogClick(progress: number) {
    props.handleCatalogClick(progress);
    chapterlistPanelVisible.value = false;
    actionBarVisible.value = false;
}

const fontSize = ref<number>(0);   // fontSize 副本
const pageTurning = ref<string>('');    // pageTurning 副本（由于是 props 拿到的是只读的，分段器使用 v-model的，同时 v-model 不允许传入只读数据，所以我们这里需要做一个副本。
const lightDarkMode = ref<'light' | 'dark'>('dark');
const chapterlistPanelVisible = ref<boolean>(false);
const preferencePanelVisible = ref<boolean>(false);
const isReverseChapterList = ref<boolean>(false);


const catalogs = computed(() => {
    const _catalogs = props.catalog?.map((v, index) => ({...v, index}));
    return !isReverseChapterList.value ? _catalogs : _catalogs.reverse();
})

function toggleChapterListPanel() {
    actionBarVisible.value = false;
    preferencePanelVisible.value = false;
    chapterlistPanelVisible.value = !chapterlistPanelVisible.value;
}

function togglePreferencePanel() {
    actionBarVisible.value = false;
    chapterlistPanelVisible.value = false;
    preferencePanelVisible.value = !preferencePanelVisible.value;
}

function toggleLightDarkMode() {
    preferencePanelVisible.value = false;
    chapterlistPanelVisible.value = false;
    props.toggleReaderDarkMode();
    actionBarVisible.value = false;
}

// TODO: 在关闭 preference panel 的时候执行副作用，即隐藏 bottom-action-bar。具体的在 self-overlay 的 :close 执行
function onPreferencePaneClose() {
    preferencePanelVisible.value = false;
}

// TODO: 同上
function onChapterListPaneClose() {
    preferencePanelVisible.value = false;
}

const bookCoverStyles = computed((): any => { 
    return function(book: Book) {
        const img = book.cover || defaultBookCover;
        return {
            background: `url(${img}), url(${defaultBookCover})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '100% 100%'
        }
    }
});

function init() {
    fontSize.value = props.curFontSize;
    pageTurning.value = t(`bookpage.${props.curPageTurning}`);  // NOTE 传入的 pagTurning 也需要 i18n
}

onMounted(() => {
    init();
})
</script>

<style scoped>
.preference-theme {
    transition: all .3s;
}

.preference-theme-active {
    outline: 1px solid var(--bookpage-bottom-preference-item-outline-color);
    outline-offset: 3px;
    transform: scale(0.9);
}

.bottom-action-bar {
    background-color: var(--bookpage-bottom-bar-bg);
    color: var(--bookpage-bottom-bar-color);
    opacity: 1;
    transform: translateY(0) scale(1);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.bottom-action-bar-hidden {
    transform: translateY(120px) scale(0.9);
    opacity: 0;
}
</style>

 
 
