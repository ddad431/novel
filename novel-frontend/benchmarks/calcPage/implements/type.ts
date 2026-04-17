export type ReaderConfig = {
    /** 页面容器 */
    page: {
        /** 页面容器宽度 (px) */
        width: number,

        /** 页面容器高度 (px) */
        height: number,
    }

    /** 标题 */
    title: {
        /** 标题字体 */
        font: string,

        /** 标题字号 (px) */
        size: number,

        /** 行高比（行高 = 字号 * 行高比) */
        ratio: number;

        /** 标题与正文间距 (px) */
        bgap: number;
    },

    /** 段落（段落数组 -> 正文） */
    paragraph: {
        /** 段落字体 */
        font: string,

        /** 段落字号 (px) */
        size: number,

        /** 行高比（行高 = 字号 * 行高比) */
        ratio: number;

        /** 段间距 (px) */
        gap: number,
    }

};

export type Line = {
    /** 行内容 */
    text: string,

    /** 行类型（标题行、标题尾行、段落行、段落尾行）*/
    type: 'title-line' | 'paragraph-line' | 'title-last-line' | 'paragraph-last-line' | 'paragraph-compress-line',

    /** 段 ID（段落行所属段） */
    pid?: number,
};

export type Page = Line[];