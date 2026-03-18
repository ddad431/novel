/**
 * 本地上传小说解析配置数据结构
 */
export type NovelParseConfig = {
    /** 小说预处理 */
    preprocess: {
        /** 移除行首空白 */
        trimStart: RegExp,

        /** 移除行尾空白 */
        trimEnd: RegExp,

        /** 移除噪音行 */
        trimLine?: RegExp[],

        /** TODO: replacement 替换不规范的字符？*/
    },

    /** 小说元数据 */
    meta: {
        /** 
         * 查找的最大行数
         * - 一般小说的元数据在最前面，如果在该范围内还找不到或者超出范围找到，那很有可能是没有或者找到的是错的。
         * */
        limit: number;

        /** 小说作者 */
        author: RegExp,

        /** 
         * 小说简介
         * - 小说简介一般是跨行的，我们需要两个定位点来定位范围。
         * - 起始行位置就是内容简介标题的的下一行，终止行位置就是第一章或第一卷。
         * */
        desc: {
            start: RegExp,
            end: RegExp,
        }
    }

    /** 小说章节列表 */
    chapters: {
        /** 章节标题 */
        title: RegExp;
    },
}

/**
 * 本地上传小说初次处理的章节数据结构（非最终存储的）
 */
export type Chapter = {
    /** 章节 id */
    id: number,

    /** 章节标题 */
    title: string,

    /** 章节内容 */
    content: string[],
};