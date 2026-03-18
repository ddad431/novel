import type { Request, Response, NextFunction } from 'express';
import type { Novel, NovelCatalog, NovelChapter } from '../models/core';
import { novelService } from '../services';

export async function handleGetNovelSearchList(req: Request, res: Response, next: NextFunction) {
    const { keyword } = req.body;  
    try {
        const result = await novelService.getNovelSearchList(keyword);

        res.status(200).json<Novel[]>({
            message: 'success',
            data: result,
        });
    }
    catch (err) {
        console.log('Function: handleGetNovelSearchList', err);
        next(err);
    }
}

export async function handleGetNovelCatalog(req: Request, res: Response, next: NextFunction) {
    const { origin, id } = req.body;
    try {
        const result = await novelService.getNovelCatalog(origin, id);

        res.status(200).json<NovelCatalog>({
            message: 'success',
            data: result,
        })
    }
    catch (err) {
        console.log('Function: handleGetNovelCatalog', err);
        next(err);
    }
}

export async function handleGetNovelChapter(req: Request, res: Response, next: NextFunction) {
    const { origin, id, cid } = req.body;
    try {
        const result = await novelService.getNovelChapter(origin, id, cid);

        res.status(200).json<NovelChapter>({
            message: 'success',
            data: result,
        })
    }
    catch (err) {
        console.log('Function: handleGetNovelChapter', err);
        next(err);
    }
}