 <template>
    <view         
        class="bottom-action-bar fixed bottom-[8px] z-9999 h-[100px] w-[calc(100vw-16px)] m-l-[8px] box-border p-[16px] rounded-[12px] flex justify-around items-center"
        :class="[actionBarVisible ? '' : 'bottom-action-bar-hidden']"
    >
        <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="toggleChapterListPanel">
            <view class="icon-list"></view>
            <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookpage.bottom.目录') }}</view>
        </view>
        <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="toggleLightDarkMode">
            <view :class="[preference.mode === 'dark' ? 'icon-moon' : 'icon-sun']"></view>
            <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ preference.mode === 'dark' ? $t('bookpage.bottom.夜晚') : $t('bookpage.bottom.白天') }}</view>
        </view>
        <view class="w-[48px] h-[50px] flex flex-col items-center justify-between gap-[8px]" @click="togglePreferencePanel">
            <view class="icon-adjustment"></view>
            <view class="text-[12px] color-[var(--action-panel-text-color)]">{{ $t('bookpage.bottom.偏好') }}</view>
        </view>
    </view>
 
    <self-overlay v-model="preferencePanelVisible" :mask="false" position="bottom">
        <view class="preference-panel-container w-[200vw] p-[8px] flex gap-[16px] bg-[var(--bookpage-reader-bg)]" :class="[curPreferencePanelTab === 'main' ? 'slide-to-left' : 'slide-to-right']">
            <view class="main z-99 w-[calc(100vw-16px)] shrink-0 box-border p-[24px] rounded-[16px]" @touchmove.stop>
                <view class="preference-font w-full m-b-[16px]">
                    <SelfSlider 
                        class="preference-font"
                        v-model="preference.fontSize"
                        @change="changeFontSize"
                        :trackHeight="44"
                        trackBg="var(--bookpage-bottom-preference-item-bg)"
                        :thumbHeight="32"
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
                        v-for="(value, key) in themes" :key
                        class="w-[44px] h-[44px] rounded-full"
                        :class="preference.theme === key ? 'preference-theme-active' : ''"
                        :style="`background-color: ${value}`"
                        @click="changeReaderTheme(key)"
                    >
                    </view>
                </view>

                <view class="flex flex-col gap-[16px] m-b-[20px]">
                    <view class="turing h-[36px] flex items-center text-[14px]">
                        <view class="w-[80%]">{{ $t('bookpage.bottom.翻页方式') }}</view>
                        <view class="preference-turing w-full">
                            <self-segmented
                                :value="$t(`bookpage.${preference.pageTurning}`)"
                                @change="props.changePageTurning"
                                :options="props.pageTurningKinds.map(v => $t(`bookpage.${v}`))"
                                height="36px"
                                bg="var(--bookpage-bottom-preference-item-bg)" 
                                active-bg="var(--bookpage-bottom-preference-item-active-bg)"  
                            />
                        </view>
                    </view>
                </view>

                <view class="preference-more text-[14px] flex justify-between" @click="curPreferencePanelTab = 'sub'">
                    <view>{{ $t('bookpage.bottom.更多设置') }}</view>
                    <view class="icon-next"></view>
                </view>
            </view>

            <view class="sub z-99 h-[264px] w-[calc(100vw-16px)] shrink-0 box-border p-[20px] rounded-[16px]" @touchmove.stop>
                <view 
                    class="title text-[14px] flex items-center relative left-[-8px] m-b-[12px]"
                    @click="curPreferencePanelTab = 'main'"
                    :class="{'font-bold': $t('bookpage.bottom.更多设置') === 'More Settings'}"
                >
                    <view class="icon-nav scale-80"></view>
                    <view>{{ $t('bookpage.bottom.更多设置') }}</view>
                </view>
                <scroll-view scroll-y="true" :show-scrollbar="false" style="height: 200px" class="h-[230px] w-full">
                    <view class="text-[14px] m-b-[8px] h-[32px] flex justify-between items-center ">
                        <view>{{ $t('bookpage.bottom.首行缩进') }}</view>
                        <view class="bg-[--bookpage-bottom-preference-item-bg] rounded-[8px] box-border p-[4px_8px] flex items-center">
                            <view 
                                class="h-[24px] w-[32px] flex justify-center items-center"
                                :class="{ 'bg-[var(--bookpage-bottom-preference-item-active-bg)] rounded-[6px]': !preference.indent}"
                                @click="changeParagraphIndent(false)"
                            >
                                <view class="icon-paragraph-no-indent"></view>
                            </view>
                            <view 
                                class="h-[24px] w-[32px] flex justify-center items-center"
                                :class="{ 'bg-[var(--bookpage-bottom-preference-item-active-bg)] rounded-[6px]': preference.indent}"
                                @click="changeParagraphIndent(true)"
                            >
                                <view class="icon-paragraph-indent"></view>
                            </view>
                        </view>
                    </view>
                    <view class="flex flex-col gap-[16px] m-b-[6px]">
                        <view class="turing h-[36px] flex items-center text-[14px]">
                            <view class="flex-1 ">{{ $t('bookpage.bottom.行间距') }}</view>
                            <view class="preference-turing w-[112px]">
                                <self-segmented
                                    :value="$t(`bookpage.bottom.${preference.lineSpacing}`)"
                                    @change="handleChangeLineSpacing"
                                    :options="['large', 'middle', 'small'].map(v => $t(`bookpage.bottom.${v}`))"
                                    height="32px"
                                    bg="var(--bookpage-bottom-preference-item-bg)" 
                                    active-bg="var(--bookpage-bottom-preference-item-active-bg)"  
                                />
                            </view>
                        </view>
                    </view>
                    <view class="flex flex-col gap-[16px] m-b-[6px]">
                        <view class="turing h-[36px] flex items-center text-[14px]">
                            <view class="flex-1">{{ $t('bookpage.bottom.段间距') }}</view>
                            <view class="preference-turing w-[112px]">
                                <self-segmented
                                    :value="$t(`bookpage.bottom.${preference.paragraphSpacing}`)"
                                    @change="handleChangeParagraphSpacing"
                                    :options="['large', 'middle', 'small'].map(v => $t(`bookpage.bottom.${v}`))"
                                    height="32px"
                                    bg="var(--bookpage-bottom-preference-item-bg)" 
                                    active-bg="var(--bookpage-bottom-preference-item-active-bg)"  
                                />
                            </view>
                        </view>
                    </view>

                    <view class="text-[14px] m-b-[12px] flex justify-between items-center">
                        <view>{{ $t('bookpage.bottom.页眉') }}</view>
                        <switch :checked="preference.header" @change="handleToggleHeader" color="var(--bookpage-bottom-preference-item-bg)" class="relative right-[-8px] scale-70"/>
                    </view>
                    <view class="text-[14px] m-b-[8px] flex justify-between items-center" @click="isFooterOptionFolded = !isFooterOptionFolded">
                        <view>{{ $t('bookpage.bottom.页脚') }}</view>
                        <view :class="[isFooterOptionFolded ? 'icon-down' : 'icon-up']"></view>
                    </view>

                    <view v-if="!isFooterOptionFolded" class="flex flex-col gap-[8px]">
                        <view class="text-[14px] flex justify-between items-center">
                            <view class="indent-[1em]">{{ $t('bookpage.bottom.页脚章进度') }}</view>
                            <switch :checked="preference.totalProgress"  @change="handleToggleFooterTotalProgress" color="var(--bookpage-bottom-preference-item-bg)" class="relative right-[-8px] scale-70"/>
                        </view>
                        <view class="text-[14px] flex justify-between items-center">
                            <view class="indent-[1em]">{{ $t('bookpage.bottom.页脚页进度') }}</view>
                            <switch :checked="preference.pageProgress"  @change="handleToggleFooterPageProgress" color="var(--bookpage-bottom-preference-item-bg)" class="relative right-[-8px] scale-70"/>
                        </view>
                        <view v-if="isSupportBatteryAPI" class="text-[14px] flex justify-between items-center">
                            <view class="indent-[1em]">{{ $t('bookpage.bottom.页脚电量') }}</view>
                            <switch :checked="preference.battery"  @change="handleToggleFooterBattery" color="var(--bookpage-bottom-preference-item-bg)" class="relative right-[-8px] scale-70"/>
                        </view>
                        <view class="text-[14px] flex justify-between items-center">
                            <view class="indent-[1em]">{{ $t('bookpage.bottom.页脚时间') }}</view>
                            <switch :checked="preference.time" @change="handleToggleFooterTime" color="var(--bookpage-bottom-preference-item-bg)" class="relative right-[-8px] scale-70"/>
                        </view>
                    </view>
                   
                </scroll-view>
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
                    :anchorBg="preference.mode === 'light' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'"
                    :anchorColor="preference.mode === 'light' ? '' : ''"
                >
                    <!-- @vue-ignore -->
                    <template #default="{ data }">
                        <div class="h-[30px] truncate text-[14px]" :style="data.index === props.curChapterIndex ? 'color: var(--bookpage-bottom-chapterlist-active-color); font-weight: bold;' : ''" @click="handleCatalogClick(data.index + 1)"> {{ data.title }}</div>
                    </template>
                </self-virtuallist>
            </view>
        </view>
    </self-overlay>
</template>

<script setup lang="ts">
import SelfSlider from '@/components/self-slider/self-slider.vue';
import { Book, Catalog } from '@/store';
import { LineSpacing, ParagraphSpacing, usePreferenceStore } from '@/store/preference';
import { computed, ref, watch } from 'vue';

import defaultBookCover from '@/static/default_cover.png';
import { useReaderTheme } from '../hooks';
import { useI18n } from 'vue-i18n';
import { useBattery } from '@/hooks/useBattery';

const { t } = useI18n();
const { preference, changeFontSize, changeReaderTheme, toggleReaderDarkMode, changeLineSpacing, changeParagraphSpacing, changeParagraphIndent, toggleFooterTotalProgress, toggleFooterPageProgress, toggleFooterTime, toggleFooterBattery, toggleHeader } = usePreferenceStore();
const { themes } = useReaderTheme();
const { isSupportBatteryAPI } = useBattery();

interface Props {
    // page
    curChapterIndex: number,

    // page turning
    pageTurningKinds: string[],
    changePageTurning: (value: string) => void,

    // book
    book: Book,

    // catalog
    catalog: Catalog,
    handleCatalogClick: (value: number) => void,
};

const actionBarVisible = defineModel('visible');
const props = defineProps<Props>();

const chapterlistPanelVisible = ref<boolean>(false);
const preferencePanelVisible = ref<boolean>(false);
const isReverseChapterList = ref<boolean>(false);
const catalogs = computed(() => {
    const _catalogs = props.catalog?.map((v, index) => ({...v, index}));
    return !isReverseChapterList.value ? _catalogs : _catalogs.reverse();
})

const curPreferencePanelTab = ref<'main' | 'sub'>('main');
const isFooterOptionFolded = ref<boolean>(true);

function handleCatalogClick(progress: number) {
    props.handleCatalogClick(progress);
    chapterlistPanelVisible.value = false;
    actionBarVisible.value = false;
}

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
    toggleReaderDarkMode();
    actionBarVisible.value = false;
}

function handleChangeLineSpacing(size: LineSpacing) {
    const _map: Record<string, LineSpacing> = {
        [t('bookpage.bottom.large')]: 'large',
        [t('bookpage.bottom.middle')]: 'middle',
        [t('bookpage.bottom.small')]: 'small',
    };
    changeLineSpacing(_map[size]);
}

function handleChangeParagraphSpacing(size: ParagraphSpacing) {
    const _map: Record<string, ParagraphSpacing> = {
        [t('bookpage.bottom.large')]: 'large',
        [t('bookpage.bottom.middle')]: 'middle',
        [t('bookpage.bottom.small')]: 'small',
    };
    changeParagraphSpacing(_map[size])
}

function handleToggleFooterTotalProgress(e: any) {
    toggleFooterTotalProgress(e.detail.value);
}

function handleToggleFooterPageProgress(e: any) {
    toggleFooterPageProgress(e.detail.value);
}

function handleToggleFooterBattery(e: any) {
    toggleFooterBattery(e.detail.value);
}

function handleToggleFooterTime(e: any) {
    toggleFooterTime(e.detail.value);
}

function handleToggleHeader(e: any) {
    toggleHeader(e.detail.value);
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

watch(preferencePanelVisible, (newVal) => {
    if (!newVal) {
        curPreferencePanelTab.value = 'main';
        isFooterOptionFolded.value = true;
    }
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

.preference-panel-container {
    transition: transform .3s ease-in-out;
}

.preference-panel-container.slide-to-right {
    transform: translateX(-50vw);
}
.preference-panel-container.slide-to-left {
    transform: translateX(calc(50vw));
}

.preference-panel-container .main,
.preference-panel-container .sub {
    background: var(--bookpage-bottom-preference-bg);
    color: var(--bookpage-bottom-preference-color);
}
</style>