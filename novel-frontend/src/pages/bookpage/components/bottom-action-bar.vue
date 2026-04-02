 <template>
    <!-- NOTE bottom-action-bar 的 z-index 必须高于 overlay，否则会被蒙层遮挡 -->
    <Transition name="slide-bottom">
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
     </Transition>

    <self-overlay v-model="preferencePanelVisible" :mask="false" position="bottom" offsetBottom="72px">
        <view 
            class="bg-[var(--bookpage-bottom-preference-bg)] color-[var(--bookpage-bottom-preference-color)] h-[216px] w-full box-border p-[24px] p-b-0 rounded-t-[16px] flex flex-col justify-between items-center gap-[24px]"
            @touchmove.prevent
        >
		
            <!-- <view class="preference-font h-[42px] flex items-center w-full rounded-[8px]" style="background: #fff;"></view> -->
            <SelfSlider 
                class="preference-font"
                v-model="fontSize"
                @change="props.changeFontSize"
                :trackHeight="42"
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

            <view class="preference-theme h-[60px] w-full flex items-center justify-between">
                <view
                    v-for="(value, key) in props.themes" :key
                    class="w-[48px] h-[48px] rounded-[8px]"
                    :class="props.curReaderTheme === key ? 'active-theme' : ''"
                    :style="`background-color: ${value}`"
                    @click="props.changeReaderTheme(key)"
                >
                </view>
            </view>

            <view class="preference-turing w-full h-[42px]">
                <self-segmented
                    v-model="pageTurning"
                    @change="props.changePageTurning"
                    :options="props.pageTurningKinds.map(v => $t(`bookpage.${v}`))"
                    height="42px" 
                    bg="var(--bookpage-bottom-preference-item-bg)" 
                    active-bg="var(--bookpage-bottom-preference-item-active-bg)"  
                />
            </view>
        </view>
    </self-overlay>

    <self-overlay v-model="chapterlistPanelVisible" position="bottom" offsetBottom="72px">
        <view class="book-info bg-[var(--bookpage-bottom-chapterlist-bg)] color-[var(--bookpage-bottom-chapterlist-color)]  h-[calc(90px+300px+24px+16px)] w-full box-border p-[24px] p-b-[0] rounded-t-[16px]">
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
                        <!-- <view>倒序</view> -->
                    </view>
                </view>
            </view>

            <view class="book-chapter flex-grow relative h-[300px]">
                <self-virtuallist :data="props.catalog?.map((v, index) => ({...v, index}))" :height="300" :itemHeight="30" :curIndex="props.curChapterIndex">
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

function toggleChapterListPanel() {
    preferencePanelVisible.value = false;
    chapterlistPanelVisible.value = !chapterlistPanelVisible.value;
}

function togglePreferencePanel() {
    chapterlistPanelVisible.value = false;
    preferencePanelVisible.value = !preferencePanelVisible.value;
}

function toggleLightDarkMode() {
    preferencePanelVisible.value = false;
    chapterlistPanelVisible.value = false;
    props.toggleReaderDarkMode();
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
   .active-theme {
        outline: 1px solid var(--bookpage-bottom-preference-item-outline-color);
        outline-offset: 3px;
    }
</style>

 
 
