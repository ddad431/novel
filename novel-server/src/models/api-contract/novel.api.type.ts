import { z } from 'zod';
import { NovelSearchRequestSchema, NovelCatalogRequestSchema, NovelChapterRequestSchema } from '../schemas/novel.schema';

export type NovelSearchRequest = z.infer<typeof NovelSearchRequestSchema>;
export type NovelCatalogRequest = z.infer<typeof NovelCatalogRequestSchema>;
export type NovelChapterRequest = z.infer<typeof NovelChapterRequestSchema>;