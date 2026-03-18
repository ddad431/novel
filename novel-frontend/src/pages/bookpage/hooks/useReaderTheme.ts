import { PreferenceStore, type ReaderTheme } from "@/store/preference";
import { computed, ref } from "vue";

export function useReaderTheme() {
    // states
    const themes: Record<ReaderTheme, string> = {
        white: '#fff',
        green: '#e5ebde',
        brown: '#efece5',
        blue: '#e3e7eb',
        dark: '#1e1e1e'
    };
    const curReaderTheme = ref<ReaderTheme>('white');
    const readerThemeClass = computed(() => {
        return curReaderTheme.value === 'white' ? '' : `${curReaderTheme.value}-reader`;
    });
    const curMode = ref<'light' | 'dark'>('light');

    // actions
    function initReaderTheme() {
        curReaderTheme.value = PreferenceStore.getPreference().theme;
        curMode.value = PreferenceStore.getPreference().mode;
    }

    function changeReaderTheme(theme: ReaderTheme): void {
        curReaderTheme.value = theme;

        const mode = theme === 'dark' ? 'dark' : 'light';
        const preference = PreferenceStore.getPreference();

        preference.mode = mode;
        curMode.value = mode;

        preference.theme = theme;
        preference.colorscheme.light = theme === 'dark' ? preference.colorscheme.light : theme; // 更新当前的 light 主题

        PreferenceStore.updatePreference(preference);
    }

    function toggleReaderDarkMode() {
        if (curMode.value === 'dark') {
            curMode.value = 'light';

            const lightTheme = PreferenceStore.getPreference().colorscheme.light;
            changeReaderTheme(lightTheme);
            return;
        }

        curMode.value === 'light';
        const darkTheme = PreferenceStore.getPreference().colorscheme.dark;
        changeReaderTheme(darkTheme);
    }

    return {
        themes,
        curReaderTheme,
        readerThemeClass,
        initReaderTheme,
        changeReaderTheme,
        curMode,
        toggleReaderDarkMode,
    }
}