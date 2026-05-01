import Profile from "@/pages/profile/profile.vue";
import { ref, watch } from "vue";
import i18n from "@/i18n";

export type ProfileLanguage = '简体中文' |  'English';
export type ProfileAppearance = '浅色' | '深色' | '跟随系统';

interface BooksourceItem {
    name: string,
    origin: string,
}

interface ProfileBooksource {
    loaded: BooksourceItem[],
    unload: BooksourceItem[],
}

export interface Profile {
    general: {
        language: ProfileLanguage,
        appearance: ProfileAppearance,
        animation: boolean,
    },
    feature: {
        booksource: ProfileBooksource,
    },
    // about: {
    //     version: string,
    //     developer: string,
    // }
}

export const DEVELOPER = 'LDOTHDOT';
export const PREFERENCES: ProfileAppearance[] = ['浅色', '深色', '跟随系统'];
export const LANGUAGES: ProfileLanguage[] = ['简体中文', 'English'];
const PROFILE_STORE_KEY = '_profile';
const DEFAULT_PROFILE: Profile = {
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
const isDarkMode = ref<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches);


function getLocalProfileStorage() {
    const _profile = uni.getStorageSync(PROFILE_STORE_KEY);
    if (!_profile) {
        setLocalPreferenceStorage(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
    }
    return _profile;
}

function setLocalPreferenceStorage(profile: Profile) {
    uni.setStorageSync(PROFILE_STORE_KEY, profile);
}

function applyLanguageSetting(lang: ProfileLanguage) {
    i18n.global.locale.value = lang === '简体中文' ? 'zh' : 'en';
}

function applyApperanceSetting(preference: ProfileAppearance) {
    // NOTE 这里要选择 body，而不是 #app, 因为有些组件借助 teleport 挂载到了 body 而不是 #app 上。
    const root = document.querySelector('body');
    if (!root) {
        return;
    }

    const setDarkMode = (isDarkMode: boolean) => isDarkMode ? root.classList.add('dark-mode') : root.classList.remove('dark-mode');

    if (preference === '浅色') {
        isDarkMode.value = false;
        setDarkMode(false);
    }
    else if (preference === '深色') {
        isDarkMode.value = true;
        setDarkMode(true);
    }
    else {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setDarkMode(mediaQuery.matches);

        mediaQuery.addEventListener('change', (e) => {
            if (preference === '跟随系统') {
                isDarkMode.value = e.matches;
                setDarkMode(e.matches);
            }
        })
    }
}

function applyAnimationSetting(enable: boolean) {
    const root = document.querySelector('body');
    if (!root)  {
        return;
    }

    root.classList.toggle('no-animation', !enable);
}

function initProfile() {
    applyApperanceSetting(profile.value.general.appearance);
    applyLanguageSetting(profile.value.general.language);
    applyAnimationSetting(profile.value.general.animation);
}

const profile = ref<Profile>(getLocalProfileStorage());

watch(profile, (newVal) => {
    setLocalPreferenceStorage(newVal);
}, { deep: true });

watch(() => profile.value.general.animation, (newVal) => {
    applyAnimationSetting(newVal);
});

watch(() => profile.value.general.appearance, (newVal) => {
    applyApperanceSetting(newVal);
});

watch(() => profile.value.general.language, (newVal) => {
    applyLanguageSetting(newVal);
});

export function useProfileStore() {  
    function setLanguage(lang: ProfileLanguage) {
        profile.value.general.language = lang;
    }

    function setAppearance(preference: ProfileAppearance) {
        profile.value.general.appearance = preference;
    }

    function enableBooksouce(source: BooksourceItem) {
        if (source.name.trim().startsWith('某某小说网')) {
            uni.showToast({icon: 'none', title: '虚假书源，仅供展示'})
            return;
        }

        profile.value.feature.booksource.unload = profile.value.feature.booksource.unload.filter(v => v.name !== source.name && v.origin !== source.origin);
        profile.value.feature.booksource.loaded.push(source);
    }

    function disableBooksource(source: BooksourceItem) {
        if (profile.value.feature.booksource.loaded.length === 1) {
            uni.showToast({icon: 'none', title: '至少提供一个书源'})
            return;
        }

        profile.value.feature.booksource.loaded = profile.value.feature.booksource.loaded.filter(v => v.name !== source.name && v.origin !== source.origin);
        profile.value.feature.booksource.unload.push(source);
    }

    function toggleAnimation() {
        profile.value.general.animation = !profile.value.general.animation;
    }

    return {
        profile,
        isDarkMode,
        initProfile,
        toggleAnimation,
        setLanguage,
        setAppearance,
        enableBooksouce,
        disableBooksource,
    }
}