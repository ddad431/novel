<template>
    <view class="h-screen w-screen relative">

        <view 
            class="profile main-page h-full w-full absolute box-border p-[16px] p-b-[calc(8px+56px)]"
            :style="`left: ${mainPageOffset}`"
        >
            <view class="title m-[32px_0] m-b-[40px] text-[32px] font-bold">{{ $t('profile.我的') }}</view>
            <template v-for="group in settings" :key="group.name">
                <view class="group-title text-[13px] m-[24px_0_8px_16px] color-[#919094]">{{ $t(`profile.${group.name}`) }}</view>
                <view class="setting-group">
                    <template v-for="setting in group.settings" :key="setting.label.name">
                            <view v-if="setting.type === 'string'" class="setting-item border-b-[1px_solid] flex justify-between" >
                                <view class="setting-label">{{ $t(`profile.${setting.label.name}`) }}</view>
                                <view class="setting-value">
                                    <view v-if="setting.label.name !== 'ICP'">{{ setting.value }}</view>
                                    <view v-else><a class="no-underline color-[--profile-setting-value-color]" href="https://beian.miit.gov.cn/" target="_blank">陕ICP备2026009614号-1</a></view>
                                </view>
                            </view>
                            <view v-else-if="setting.type === 'button'" class="setting-item border-b-[1px_solid] flex justify-between" >
                                <view class="setting-label">{{ $t(`profile.${setting.label.name}`) }}</view>
                                <switch v-if="setting.type === 'button'" @click="setting.action" color="#33c658" style="transform: scale(.8);" :checked="setting.value" />
                            </view>
                            <view v-else-if="setting.type === 'subpage'" class="setting-item border-b-[1px_solid] flex justify-between" @click="handleNavToSubPage(setting.label.name as SubPage)" >
                                <view class="setting-label">{{ $t(`profile.${setting.label.name}`) }}</view>
                                <view class="setting-value flex items-center">
                                    <view class="relative left-[10px]">{{ $t(`profile.${setting.value}`) }}</view>
                                    <view class="icon-nav-right relative left-[7px]"></view>
                                </view>
                            </view>
                            <view v-else-if="setting.type === 'popup'" class="setting-item border-b-[1px_solid] flex justify-between" >
                                <view class="setting-label">{{ $t(`profile.${setting.label.name}`) }}</view>
                                <!-- TODO -->
                            </view>
                    </template>
                </view>
            </template>

        </view>
        
        <view 
            class="profile sub-page h-full w-full absolute box-border p-[16px] p-b-[calc(8px+56px)]"
            :style="`left: calc(${subPageOffset})`"
        >
            <view v-if="curSubPage === '语言'">
                <view class="profile-header w-full flex color-[#777] m-b-[32px] color-[var(--profile-color)]">
                    <view class="icon-nav right-[5px]" @click="handleBackToMainPage"></view>
                    <view class="flex-grow-1 justify-center text-center font-bold">{{ $t('profile.语言') }}</view>
                </view>

                <view class="group-title text-[13px] m-[24px_0_8px_16px] color-[#919094]">{{ $t('profile.选择语言') }}</view>
                    <view class="setting-group features">
                        <template v-for="(value, index) in LANGUAGES" :key="index">
                            <view class="setting-item" @click="handelChangeLanguage(value as Languages)">
                                <view class="setting-label">{{ value }}</view>
                                <view v-if="profile?.general.language === value" class="color-[#007aff]">✓</view>
                            </view>
                        </template>
                    </view>
            </view>

            <view v-else-if="curSubPage === '外观'">
                <view class="profile-header w-full flex color-[#777] m-b-[32px] color-[var(--profile-color)]">
                    <view class="icon-nav relative right-[5px]" @click="handleBackToMainPage"></view>
                    <view class="flex-grow-1 justify-center text-center font-bold">{{ $t('profile.外观') }}</view>
                </view>

                <view class="group-title text-[13px] m-[24px_0_8px_16px] color-[#919094]">{{ $t('profile.选择主题样式') }}</view>
                    <view class="setting-group features">
                        <template v-for="(value, key) in PREFERENCES" :key>
                            <view class="setting-item" @click="handleChangePreference(value as Preference)">
                                <view class="setting-label">{{ $t(`profile.${value}`) }}</view>
                                <view v-if="profile?.general.appearance === value" class="color-[#007aff]">✓</view>
                            </view>
                        </template>
                    </view> 
            </view>

            <view v-else-if="curSubPage === '书源'">
                <view class="profile-header w-full flex color-[#777] m-b-[32px] color-[var(--profile-color)] font-500">
                    <view class="icon-nav relative right-[5px]" @click="handleBackToMainPage"></view>
                    <view class="flex-grow-1 justify-center text-center">{{ $t('profile.书源') }}</view>
                </view>

                <view class="group-title text-[13px] m-[24px_0_8px_16px] color-[#919094]">{{ $t('profile.已加载书源')}}</view>
                    <view v-if="booksource!.loaded.length" class="setting-group features">
                        <template v-for="(item, index) in booksource!.loaded" :key="index">
                            <view class="setting-item" style="height: 60px">
                                <view class="setting-label flex-col gap-[10px]">
                                    <view class="label">{{ item.name }}</view>
                                    <view class="desc text-[13px]  color-[var(--profile-setting-group-title-color)]">{{ item.origin }}</view>
                                </view>
                                <view class="icon-list-remove color-[#ff3b30]" @click="handleRemoveSource(item)"></view>
                            </view>
                        </template>
                    </view> 

                <view class="group-title text-[13px] m-[24px_0_8px_16px] color-[#919094]">{{ $t('profile.添加书源') }}</view>
                <view v-if="booksource!.unload.length > 0" class="setting-group features">
                    <template v-for="(item, index) in booksource!.unload" :key="index">
                        <view class="setting-item" style="height: 60px">
                            <view class="setting-label flex-col gap-[10px]">
                                <view class="label">{{ item.name }}</view>
                                <view class="desc text-[13px]  color-[var(--profile-setting-group-title-color)]">{{ item.origin }}</view>
                            </view>
                            <view class="icon-list-add color-[#007aff]" @click="handleAddSource(item)"></view>
                        </view>
                    </template>
                </view> 
            </view>
        </view>

        <SelfTabbar />
    </view>
</template>
 
<script setup lang="ts">
import SelfTabbar from '@/components/self-tabbar/self-tabbar.vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

type ProfileStroage = {
    general: {
        language: '简体中文' |  'English',
        appearance: '浅色' | '深色' | '跟随系统',
        animation: boolean,
    },
    feature: {
        booksource: {
            loaded: Array<{
                name: string,
                origin: string,
            }>,
            unload: Array<{
                name: string,
                origin: string,
            }>,
        }
    },
    // about: {
    //     version: string,
    //     developer: string,
    // }
};

type Settings = Array<{
    /** 分组名 */
    name: string,

    /** 分组设置项 */
    settings: Array<{
        /** 设置项类型（仅字符串、button 开关、popup 浮窗、page 新页、二级页面） */
        type: 'string' | 'button' | 'subpage' | 'select' | 'popup',

        /** 设置项名 */
        label: {
            name: string,
            desc?: string,
        },

        value: any,

        action?: any,
    }>,
}>;

type BookSource = {
    loaded: Array<{
        name: string, 
        origin: string  
    }>,
    unload: Array<{
        name: string, 
        origin: string  
    }>
}

type SubPage = '语言' | '外观' | '书源';
type Preference = '浅色' | '深色' | '跟随系统';
type Languages = '简体中文' | 'English';

const DEVELOPER = 'LDOTHDOT';
const PROFILE_STORAGE_KEY = '_profile';
const BOOKSOURCE_STORAGE_KEY = '_booksource';
const PREFERENCES = ['浅色', '深色', '跟随系统'];
const LANGUAGES = ['简体中文', 'English'];
const DEFAULT_PROFILE: ProfileStroage = {
    general: {
        language: '简体中文',
        appearance: '跟随系统',
        animation: true,
    },
    feature: {
        booksource: {
            loaded: [
                {
                    name: '书海阁小说网',
                    origin: 'm.shuhaige.net',
                },
                {
                    name: '新笔趣阁',
                    origin: 'biquge.xin',
                }
            ],
            unload: [
                {
                    name: '某某小说网',
                    origin: 'xx.novel.com'
                }
            ]
        }
    }
};
const profile = ref<ProfileStroage>();
const settings = ref<Settings>();

const curSubPage = ref<SubPage>('书源');
const mainPageOffset = ref<string>('0');
const subPageOffset = ref<string>('100vw');

const booksource = ref<BookSource>();

function initProfile() {
    profile.value = uni.getStorageSync(PROFILE_STORAGE_KEY);
    if (!profile.value) {
        profile.value = DEFAULT_PROFILE;
        uni.setStorageSync(PROFILE_STORAGE_KEY, DEFAULT_PROFILE);
    }
}

function initBooksource() {
    const DEFAULT_BOOKSOURCE = {
        loaded: [
            {
                name: '新笔趣阁',
                origin: 'biquge.xin'
            },
            {
                name: '书海阁小说网',
                origin: 'm.shuhaige.net',
            }
        ],
        unload: [
            {
                name: '测试用例',
                origin: 'xxx.novel.com',
            }
        ],
    };

    booksource.value = uni.getStorageSync(BOOKSOURCE_STORAGE_KEY);
    if (!booksource.value) {
        booksource.value = DEFAULT_BOOKSOURCE;
        uni.setStorageSync(BOOKSOURCE_STORAGE_KEY, booksource.value);
    }
}

function generateUISettings(store: ProfileStroage): Settings {
    const getAppVersion = (): string => {
        return import.meta.env.PACKAGE_VERSION || '1.0.0';
    };

    return [
        {
            name: '通用',
            settings: [
                {
                    type: 'subpage',
                    label: {
                        name: '语言',
                    },
                    value: store.general.language,
                },
                {
                    type: 'subpage',
                    label: {
                        name: '外观',
                    },
                    value: store.general.appearance,
                },
                {
                    type: 'button',
                    label: {
                        name: '动画',
                    },
                    value: store.general.animation,
                    action: handleToggleAnimation,
                }
            ]
        },
        {
            name: '功能',
            settings: [
                {
                    type: 'subpage',
                    label: {
                        name: '书源',
                    },
                    value: '',
                }
            ]

        },
        {
            name: '关于',
            settings: [
                {
                    type: 'string',
                    label: {
                        name: '版本',
                    },
                    value: getAppVersion(),
                },
                {
                    type: 'string',
                    label: {
                        name: '开发者',
                    },
                    value: DEVELOPER,
                },
                {
                    type: 'string',
                    label: {
                        name: 'ICP',
                    },
                    value: '陕ICP备2026009614号-1'
                }
            ]
        }
    ];
}

function handleNavToSubPage(page: SubPage) {
    curSubPage.value = page;

    mainPageOffset.value = '-100vw';
    subPageOffset.value = '0vw';
}

function handleBackToMainPage() {
    subPageOffset.value = '100vw',
    mainPageOffset.value = '0vw';
}

function handelChangeLanguage(lang: Languages) {
    profile.value!.general.language = lang;
    locale.value = lang === '简体中文' ? 'zh' : 'en';
}

function handleToggleAnimation() {
    // TODO: 当前只能屏蔽部分动画。内置组件（例如 swiper）动画无法屏蔽。
    profile.value!.general.animation = !profile.value!.general.animation;

    const root = document.querySelector('body');
    root?.classList.toggle('no-animation'); // NOTE no-anmation 位于 animation.css 全局文件中   
}

function handleChangePreference(value: Preference) {
    // NOTE 这里要选择 body，而不是 #app, 因为有些组件借助 teleport 挂载到了 body 而不是 #app 上。
    const root = document.querySelector('body');
    if (!root) {
        return;
    }

    profile.value!.general.appearance = value;
    const setDarkMode = (isDarkMode: boolean) => isDarkMode ? root.classList.add('dark-mode') : root.classList.remove('dark-mode');
    
    if (value === '浅色') {
        setDarkMode(false);
    }
    else if (value === '深色') {
        setDarkMode(true);
    }
    else {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setDarkMode(mediaQuery.matches);

        mediaQuery.addEventListener('change', (e) => {
            if (value === '跟随系统') {
                setDarkMode(e.matches);
            }
        })
    }
}

function handleRemoveSource(source: { origin: string, name: string }) {
    if (booksource.value!.loaded.length === 1) {
        uni.showToast({icon: 'none', title: '至少提供一个书源'})
        return;
    }

    booksource.value!.loaded = booksource.value!.loaded.filter(v => v.name !== source.name && v.origin !== source.origin);
    booksource.value!.unload.push(source);
}

function handleAddSource(source: { origin: string, name: string }) {
    if (source.name.trim().startsWith('测试用例')) {
        uni.showToast({icon: 'none', title: '虚假书源，仅供展示'})
        return;
    }

    booksource.value!.unload = booksource.value!.unload.filter(v => v.name !== source.name && v.origin !== source.origin);
    booksource.value!.loaded.push(source); 
}

// lifetime
let isFirst = false;
watch(profile, (newVal) => {
    if (newVal) {
        if (!isFirst) {
            // NOTE 在首次加载 profile 时，同步应用对应的设置效果
            locale.value = newVal.general.language === 'English' ? 'en' : 'zh';
            handleChangePreference(newVal.general.appearance);
            if (!newVal.general.animation) {
                const root = document.querySelector('body');
                root?.classList.add('no-animation'); 
            }

            isFirst = true;
        }

        uni.setStorageSync(PROFILE_STORAGE_KEY, newVal);
        settings.value = generateUISettings(newVal);
    }
}, { deep: true });

watch(booksource,  (newVal) => {
    uni.setStorageSync(BOOKSOURCE_STORAGE_KEY, newVal);
}, { deep: true });

onLoad(() => {
    initProfile();
    initBooksource();
});

onShow(() => {
    uni.hideTabBar();
})
</script>

<style scoped>
    /* NOTE 指定 tabbar 的背景色*/
    .tabbar {
        background-color: var(--profile-bg);
    }

    .profile {
        background-color: var(--profile-bg);
        color: var(--profile-color);
    }

    .main-page, .sub-page {
        transition: left .2s ease-in-out;
  
        /* 性能优化：告诉浏览器这个属性会变，开启硬件加速 */
        will-change: left; 
    }

    .group-title {
        height: 15px;
        font-size: 13px;
        margin: 24px 0 8px 16px;
        color: var(--profile-setting-group-title-color);
    }

    .setting-group {
        font-size: 16px;
        color: var(--profile-setting-group-color);
        background-color: var(--profile-setting-group-bg);
        border-radius: 8px;
        
    }

    .setting-item {
        height: 48px;
        box-sizing: border-box;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .setting-item:not(:last-child) {
        border-bottom: 1px solid var(--profile-setting-seperate-color);
    }


    .setting-value {
        font-size: 15px;
        color: var(--profile-setting-value-color);
    }
</style>