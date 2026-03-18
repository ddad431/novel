import { z } from 'zod';

// Request
export const NovelSearchRequestSchema = z.object({
    keyword: z.string().min(1, { error: '搜索关键词不能为空' }),
});

export const NovelCatalogRequestSchema = z.object({
    origin: z.union([z.httpUrl(), z.literal('local')], { error: (issue) => `${issue.input} 不是有效的 HTTP URL 或 'local'` }),
    id: z.coerce.string().min(1, { error: '小说 ID 不能为空' }),
});

export const NovelChapterRequestSchema = z.object({
    origin: z.union([z.httpUrl(), z.literal('local')], { error: (issue) => `${issue.input} 不是有效的 HTTP URL 或 'local'` }),
    id: z.coerce.string().min(1, { error: '小说 ID 不能为空' }),
    cid: z.coerce.string().min(1, { error: '章节 ID 不能为空' }),
});