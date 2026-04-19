import { usePreferenceStore, type ReaderTheme } from "@/store/preference";
import { computed } from "vue";

export function useReaderTheme() {
    // dependencies
    const { preference } = usePreferenceStore();

    // states
    const themes: Record<ReaderTheme, string> = {
        white: '#fff',
        green: '#e5ebde',
        brown: '#efece5',
        blue: '#e3e7eb',
        dark: '#1e1e1e'
    };
    const readerThemeClass = computed(() => {
        return preference.value.theme === 'white' ? '' : `${preference.value.theme}-reader`;
    });

    return {
        themes,
        readerThemeClass,
    }
}