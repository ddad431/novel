import { computed, ComputedRef, Ref, ref } from "vue";
import { ReaderConfig } from "@/reader/reader";
import { usePreferenceStore } from "@/store/preference";

const { preference } = usePreferenceStore();

const curLineHeightRatio = computed(() => {
    switch (preference.value.lineSpacing!) {
        case 'large':
            return 2;
        case 'middle':
            return 1.88;
        case 'small':
            return 1.7
    }
});
const curParagraphSpacingRatio = computed(() => {
    switch (preference.value.paragraphSpacing!) {
        case 'large':
            return 2;
        case 'middle':
            return 1.8;
        case 'small':
            return 1.35;
    }   
});

const titleFontSize = computed(() => preference.value.fontSize * 1.5);
const titleLineHeightRatio = computed(() => Math.max(1, curLineHeightRatio.value - 0.3));
const titleGap = computed(() => 2 * preference.value.fontSize);
const paragraphGap = computed(() => curParagraphSpacingRatio.value * preference.value.fontSize);

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

function calcPageHeight(height: number, hasHeader: boolean, hasFooter: boolean) {
    const { verticalPadding, gap, headerHeight, footerHeight } = READER_LAYOUT;
    let diff = 2 * verticalPadding;

    if (hasHeader && hasFooter) {
        diff += (2 * gap + headerHeight + footerHeight);
    } else if (hasFooter) {
        diff += (gap + footerHeight);
    } else if (hasHeader) {
        diff += (gap + headerHeight);
    }
    
    return height - diff;
};

function createReaderConfig(width: Ref<number>, height: Ref<number>): ComputedRef<ReaderConfig> {
    return computed(() => ({
        page: {
            width: width.value - 2 * READER_LAYOUT.horizontalPadding,
            height: calcPageHeight(height.value, preference.value.header, preference.value.footer),
        },
        title: {
            font: preference.value.font,
            size: titleFontSize.value,
            ratio: titleLineHeightRatio.value,
            bgap: titleGap.value,
        },
        paragraph: {
            font: preference.value.font,
            size: preference.value.fontSize,
            ratio: curLineHeightRatio.value,
            gap: paragraphGap.value,
            indent: preference.value.indent,
        }
    }));
}

export function useReaderPageConfig() {
    const titleLineStyles = computed(() => {
        return {
            'font-family': preference.value.font,
            'font-size': `${titleFontSize.value}px`,
            'line-height': `${titleLineHeightRatio.value}em`,
        }
    });
    const titleLastLineStyles = computed(() => {
        return {
            'font-family': preference.value.font,
            'font-size': `${titleFontSize.value}px`,
            'line-height': `${titleLineHeightRatio.value}em`,
            'margin-bottom': `${titleGap.value}px`,
        }
    });
    const paragraphLineStyles = computed(() => {
        return {
            'font-family': preference.value.font,
            'font-size': `${preference.value.fontSize}px`,
            'line-height': `${curLineHeightRatio.value}em`,
        }
    });
    const paragraphIndentLineStyles = computed(() => {
        return {
            'text-indent': '2em',
            'font-family': preference.value.font,
            'font-size': `${preference.value.fontSize}px`,
            'line-height': `${curLineHeightRatio.value}em`,
        }
    });
    const paragraphLastLineStyles = computed(() => {
        return {
            'font-family': preference.value.font,
            'font-size': `${preference.value.fontSize}px`,
            'line-height': `${curLineHeightRatio.value}em`,
            'margin-bottom': `${paragraphGap.value}px`,
        }
    });
    const paragraphIndentLastLineStyles = computed(() => {
        return {
            'text-indent': '2em',
            'font-family': preference.value.font,
            'font-size': `${preference.value.fontSize}px`,
            'line-height': `${curLineHeightRatio.value}em`,
            'margin-bottom': `${paragraphGap.value}px`,
        }
    });
    const paragraphCompressLineStyles = computed(() => {
        return {
            'font-family': preference.value.font,
            'font-size': `${preference.value.fontSize}px`,
        }
    })

    return {
        READER_LAYOUT,
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