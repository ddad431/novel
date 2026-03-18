import type { NovelParseConfig } from "./type";

/**
 * 本地上传小说默认解析配置
 */
const _default: NovelParseConfig = {
    preprocess: {
        trimStart: /^[\s\u3000]+/,
        trimEnd: /[\s\u3000]+$/,
        // TODO: 广告
        trimLine: [
            /^第\s*(\d{0,2}|[零一二三四五六七八九十]{1,3})\s*卷/,
        ],
    },
    meta: {
        limit: 100,
        author: /^作者[:|：]\s*(.*)$/,
        desc: {
            start: /^内容简介[:|：]$/,
            end: /^第\s*(1|01|001|0001|一|0{1,4}|零)\s*章/, // NOTE 还有第 000 章...
        }
    },
    chapters: {
        title: /^第\s*(1\d{0,4}|\d{1,4}|[零一二三四五六七八九十百千万]{1,9})\s*章/,
    }
}

export default _default;