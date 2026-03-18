import { Router } from "express";
import { handleGetNovelSearchList, handleGetNovelCatalog, handleGetNovelChapter } from '../controllers/novel.controller';
import { NovelSearchRequestSchema, NovelCatalogRequestSchema, NovelChapterRequestSchema } from '../models/schemas';
import { validateMiddleware } from '../middlewares';

const novelRouter = Router();

// POST /novel/search
novelRouter.post('/search', validateMiddleware(NovelSearchRequestSchema), handleGetNovelSearchList);
// POST /novel/catalog
novelRouter.post('/catalog', validateMiddleware(NovelCatalogRequestSchema), handleGetNovelCatalog)
// POST /novel/chapter
novelRouter.post('/chapter', validateMiddleware(NovelChapterRequestSchema), handleGetNovelChapter);

export default novelRouter;