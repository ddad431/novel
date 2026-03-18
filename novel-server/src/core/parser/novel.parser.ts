import type { NovelParseConfig, Chapter } from './config/type';
import type { LocalNovel, Novel, NovelCatalog, NovelChapter } from '../../models/core';

import path from 'path';
import { _merge } from '../../utils/merge.util';
import { _read } from '../../utils/file.util';
import { calcFileMd5 } from '../../utils/crypto.util';
import _default from'./config/default';

export async function _parse(file: string, config?: NovelParseConfig) {
    config = config ? _merge(_default, config) : _default;

    const novel = await _read(file);
    const lines: string[] = preprocess(novel.split(/\r?\n/), config.preprocess);
    const rawdata = extractNovelChapters(lines, config.chapters);
    const meta: LocalNovel = extractNovelMetadata(lines, config.meta);
    
    meta.id = await calcFileMd5(file);
    meta.name = path.basename(file).split('.')[0];
    meta.total = rawdata.length;
    const catalog: NovelCatalog = rawdata.map(v => ({ cid: String(v.id), title: v.title }));
    const chapters: NovelChapter[] = rawdata.map(v => v.content);

    return {
        meta,
        catalog,
        chapters,
    }
}

/**
 * 小说解析预处理
 */
function preprocess(lines: string[], patterns: NovelParseConfig['preprocess']): string[] {
    const { trimEnd, trimStart, trimLine } = patterns;
    let noise: RegExp | null = null;
    let result: string[] = [];

    if (trimLine && trimLine.length > 0) {
        noise = new RegExp(trimLine.map(v => v.source).join('|'), 'gi');
    }

    for (const line of lines) {
        let newline = line; 

        if (noise && noise.test(line)) {
            continue;
        }

        if (trimStart) {
            newline = newline.replace(trimStart, '');
        }

        if (trimEnd) {
            newline = newline.replace(trimEnd, '');
        }

        result.push(newline);
    }

    return result;
}


/**
 * 提取小说元数据
 */
function extractNovelMetadata(lines: string[], patterns: NovelParseConfig['meta']): LocalNovel {
    const searchlines = lines.slice(0, patterns.limit);
    const author = searchlines.find(line => line.match(patterns.author))?.match(patterns.author)?.[1] ?? '';
    const startIdx = searchlines.findIndex(line => line.match(patterns.desc.start));
    const endIdx = searchlines.findIndex(line => line.match(patterns.desc.end));
    const desc = (startIdx === -1 || endIdx === -1 || endIdx === startIdx + 1)
        ? ''
        : searchlines.slice(startIdx + 1, endIdx).filter(line => line !== '').join('\n');

    return {
        source: '本地',
        origin: 'local',
        id: '', // 需要更新
        name: '', // 需要更新（小说名不在小说内部提取）
        author,
        desc,
        cover: '',
        status: '本地',
        tag: '',
        total: 0, // 需要更新（小说章节总数要在提取章节后获取）
    };
}

/** 
 * 提取小说章节（非最终章节数据）
 */
function extractNovelChapters(lines: string[], patterns: NovelParseConfig['chapters']): Chapter[] {
    const chapteridx: number[] = [];
    const chapters: Chapter[] = [];

    lines.forEach((line, index) => {
        if (line.search(patterns.title) !== -1) {
            chapteridx.push(index);
        }
    });

    for (let i = 0; i < chapteridx.length; ++i) {
        const start = chapteridx[i];
        const end = chapteridx[i + 1] ?? lines.length - 1;

        chapters.push({
            id: i,
            title: lines[start],
            content: lines.slice(start + 1, end),
        });
    }

    return chapters;
}