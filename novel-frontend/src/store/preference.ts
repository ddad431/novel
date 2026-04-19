import { ref, watch } from "vue";

export type PageTurning = 
    | '覆盖' 
    | '平移' 
    | '无';
export type ReaderTheme = 
    | 'white'
    | 'green'
    | 'brown'
    | 'blue' 
    | 'dark';
export type LineSpacing = 'large' | 'middle' | 'small';
export type ParagraphSpacing = 'large' | 'middle' | 'small';
export type Preference = {
    header: boolean,
    footer: boolean,
    totalProgress: boolean,
    pageProgress: boolean,
    time: boolean,
    battery: boolean,
    font: string,
    fontSize: number,
    indent: boolean,
    lineSpacing: LineSpacing,
    paragraphSpacing: ParagraphSpacing,
    pageTurning: PageTurning,
    theme: ReaderTheme,
    mode: 'light' | 'dark',
    colorscheme: {
        dark: 'dark',
        light: 'white' | 'green' | 'brown' | 'blue',
    }
};

const PREFERENCE_STORE_KEY = '_preference';
const DEFAULT_PREFERENCE: Preference = {
    indent: false,
    font: 'Arial',
    fontSize: 18,
    pageTurning: '覆盖',
    lineSpacing: 'small',
    paragraphSpacing: 'small',
    theme: 'white',
    mode: 'light',
    colorscheme: {
        dark: 'dark',
        light: 'white',
    },
    header: true,
    footer: true,
    totalProgress: true,
    pageProgress: true,
    time: true,
    battery: true,
};

function getLocalPreferenceStorage(): Preference {
    const preference = uni.getStorageSync(PREFERENCE_STORE_KEY);
    
    if (!preference) {
        setLocalPreferenceStorage(DEFAULT_PREFERENCE);
        return DEFAULT_PREFERENCE;
    }
    return preference;
}

function setLocalPreferenceStorage(preference: Preference) {
    uni.setStorageSync(PREFERENCE_STORE_KEY, preference);
}

const preference = ref<Preference>(getLocalPreferenceStorage());

watch(preference, (newVal) => {
    setLocalPreferenceStorage(newVal!);
}, { deep: true })

export function usePreferenceStore() {
    function changeFontSize(curFontSize: number) {
        preference.value.fontSize = curFontSize;
    }

    function changeLineSpacing(size: LineSpacing) {
        preference.value.lineSpacing = size;
    }

    function changeParagraphSpacing(size: ParagraphSpacing) {
        preference.value.paragraphSpacing = size;
    }

    function changeParagraphIndent(enable: boolean) {
        if (preference.value.indent === enable) {
            return;
        }
        preference.value.indent = enable;
    }

    function toggleHeader(enable: boolean) {
        preference.value.header = enable;
    }

    function toggleFooter(enable: boolean) {
        preference.value.footer = enable;
    }

    function toggleFooterTotalProgress(enable: boolean) {
        if (enable) {
            if (!preference.value.footer) {
                preference.value.footer = true;
            }

            preference.value.totalProgress = enable;
            return;
        }

        if (!preference.value.pageProgress && !preference.value.battery && !preference.value.time) {
            preference.value.footer = false;
        }
        preference.value.totalProgress = enable;
    }

    function toggleFooterPageProgress(enable: boolean) {
        if (enable) {
            if (!preference.value.footer) {
                preference.value.footer = true;
            }
            
            preference.value.pageProgress = enable;
            return;
        }

        if (!preference.value.totalProgress && !preference.value.battery && !preference.value.time) {
            preference.value.footer = false;
        }
        preference.value.pageProgress = enable;
    }

    function toggleFooterTime(enable: boolean) {
        if (enable) {
            if (!preference.value.footer) {
                preference.value.footer = true;
            }
            
            preference.value.time = enable;
            return;
        }

        if (!preference.value.pageProgress && !preference.value.battery && !preference.value.totalProgress) {
            preference.value.footer = false;
        }
        preference.value.time = enable;
    }

    function toggleFooterBattery(enable: boolean) {
        if (enable) {
            if (!preference.value.footer) {
                preference.value.footer = true;
            }
            
            preference.value.battery = enable;
            return;
        }

        if (!preference.value.pageProgress && !preference.value.totalProgress && !preference.value.time) {
            preference.value.footer = false;
        }
        preference.value.battery = enable;
    }

    function changeReaderTheme(theme: ReaderTheme) {
        if (theme === preference.value.theme) {
            return;
        }
    
        preference.value.mode = theme === 'dark' ? 'dark' : 'light';
        preference.value.theme = theme;
        preference.value.colorscheme.light = theme === 'dark' ? preference.value.colorscheme.light : theme;
    }

    function toggleReaderDarkMode() {
        if (preference.value.mode === 'dark') {
            changeReaderTheme(preference.value.colorscheme.light);
            return;
        }
        changeReaderTheme('dark');
    }

    return {
        preference,
        changeFontSize,
        changeLineSpacing,
        changeParagraphSpacing,
        changeReaderTheme,
        changeParagraphIndent,
        toggleHeader,
        toggleFooter,
        toggleFooterTotalProgress,
        toggleFooterPageProgress,
        toggleFooterTime,
        toggleFooterBattery,
        toggleReaderDarkMode,
    }
}
