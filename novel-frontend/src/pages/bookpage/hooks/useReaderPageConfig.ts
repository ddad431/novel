import { computed, Ref, ref } from "vue";
import { ReaderConfig } from "@/reader/reader";
import { PreferenceStore } from "@/store/preference";

const curFont = ref<string>('Arial');
const curFontSize = ref<number>(18);
const curLineHeightRatio = ref<number>(1.7);   // 1.88, 1.7

const titleFontSize = computed(() => curFontSize.value * 1.5);
const titleLineHeightRatio = computed(() => Math.max(1, curLineHeightRatio.value - 0.3));
const titleGap = computed(() => 2 * curFontSize.value);
const paragraphGap = computed(() => 1.35 * curFontSize.value);   // 1.8, 1.35

const READER_LAYOUT = {
    /** 阅读页左右边距 */
    horizontalPadding: 20,

    /** 阅读页上下边距 */
    verticalPadding: 16,

    /** 页眉高度 */
    headerHeight: 16,

    /** 页脚高度 */
    footerHeight: 16,

    /** 页眉、正文、页脚间距 */
    gap: 16,
}

function createReaderConfig(width: Ref<number>, height: Ref<number>) {
    return computed(() => ({
        page: {
            width: width.value - 2 * READER_LAYOUT.horizontalPadding,
            height: height.value - (2 * READER_LAYOUT.verticalPadding + 2 * READER_LAYOUT.gap + READER_LAYOUT.headerHeight + READER_LAYOUT.footerHeight),
        },
        title: {
            font: curFont.value,
            size: titleFontSize.value,
            ratio: titleLineHeightRatio.value,
            bgap: titleGap.value,
        },
        paragraph: {
            font: curFont.value,
            size: curFontSize.value,
            ratio: curLineHeightRatio.value,
            gap: paragraphGap.value,
            indent: false,
        }
    }));
}

export function useReaderPageConfig() {
    const titleLineStyles = computed(() => {
        return {
            'font-family': curFont.value,
            'font-size': `${titleFontSize.value}px`,
            'line-height': `${titleLineHeightRatio.value}em`,
        }
    });
    const titleLastLineStyles = computed(() => {
        return {
            'font-family': curFont.value,
            'font-size': `${titleFontSize.value}px`,
            'line-height': `${titleLineHeightRatio.value}em`,
            'margin-bottom': `${titleGap.value}px`,
        }
    });
    const paragraphLineStyles = computed(() => {
        return {
            'font-family': curFont.value,
            'font-size': `${curFontSize.value}px`,
            'line-height': `${curLineHeightRatio.value}em`,
        }
    });
    const paragraphIndentLineStyles = computed(() => {
        return {
            'text-indent': '2em',
            'font-family': curFont.value,
            'font-size': `${curFontSize.value}px`,
            'line-height': `${curLineHeightRatio.value}em`,
        }
    });
    const paragraphLastLineStyles = computed(() => {
        return {
            'font-family': curFont.value,
            'font-size': `${curFontSize.value}px`,
            'line-height': `${curLineHeightRatio.value}em`,
            'margin-bottom': `${paragraphGap.value}px`,
        }
    });
    const paragraphIndentLastLineStyles = computed(() => {
        return {
            'text-indent': '2em',
            'font-family': curFont.value,
            'font-size': `${curFontSize.value}px`,
            'line-height': `${curLineHeightRatio.value}em`,
            'margin-bottom': `${paragraphGap.value}px`,
        }
    });
    const paragraphCompressLineStyles = computed(() => {
        return {
            'font-family': curFont.value,
            'font-size': `${curFontSize.value}px`,
        }
    })

    function initFontSize() {
        curFontSize.value = PreferenceStore.getPreference().fontSize;
    }

    function changeFontSize(size: number) {
        curFontSize.value = size;

        const preference = PreferenceStore.getPreference();
        preference.fontSize = size;
        PreferenceStore.updatePreference(preference);
    }

    return {
        READER_LAYOUT,
        curFontSize,
        initFontSize,
        changeFontSize,
        createReaderConfig,
        titleLineStyles,
        titleLastLineStyles,
        paragraphLineStyles,
        paragraphLastLineStyles,
        paragraphCompressLineStyles,
        paragraphIndentLineStyles,
        paragraphIndentLastLineStyles,
    }
}