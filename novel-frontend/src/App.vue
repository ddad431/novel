<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

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
};
type Languages = '简体中文' | '英文';
type Preference = '浅色' | '深色' | '跟随系统';

const PROFILE_STORAGE_KEY = '_profile';
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
const profile: ProfileStroage = uni.getStorageSync(PROFILE_STORAGE_KEY) ?? DEFAULT_PROFILE;

function applyLanguageSetting(lang: Languages) {
    locale.value = lang === '简体中文' ? 'zh' : 'en';
}

function applyAniamtionSetting(enable: boolean) {
    const root = document.querySelector('body');
    if (!root)  {
        return;
    }

    if (enable) {
        if (root.classList.contains('no-animation')) {
            root.classList.remove('no-animation');
        }
        return;
    }
    else {
        if (!root.classList.contains('no-animation')) {
            root.classList.add('no-animation');
        }
        return;
    }
}

function applyPreferenceSetting(value: Preference) {
    // NOTE 这里要选择 body，而不是 #app, 因为有些组件借助 teleport 挂载到了 body 而不是 #app 上。
    const root = document.querySelector('body');
    if (!root) {
        return;
    }

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

function applyProfile(profile: ProfileStroage) {
    applyPreferenceSetting(profile.general.appearance);
    applyLanguageSetting(profile.general.language as Languages);
    applyAniamtionSetting(profile.general.animation);
}

onLaunch(() => {
    console.log('App Launch');
    applyProfile(profile);
});
onShow(() => {
    console.log('App Show');
});
onHide(() => {
    console.log('App Hide');
});
</script>