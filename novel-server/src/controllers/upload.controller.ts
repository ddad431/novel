import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';
import { novelService, uploadService } from '../services';
import { calcFileMd5 } from '../utils/crypto.util';
import type { Novel } from '../models/core';

export async function handleUploadReceive(req: Request, res: Response, next: NextFunction) {
    try {
        await uploadService.receive(req);

        res.status(204).end();
    }
    catch (UPLOAD_RECEIVE_ERROR) {
        console.log('Function: handleUploadReceive', UPLOAD_RECEIVE_ERROR);
        next(UPLOAD_RECEIVE_ERROR);
    }
}

export async function handleUploadMerge(req: Request, res: Response, next: NextFunction) {
    const { name } = req.body;
    let file = '';
    let data = {} as Novel;

    try {
        file = await uploadService.merge(name);

        const md5 = await calcFileMd5(file);
        const novel = await novelService.getNovel('local', md5);
        if (novel) {
            console.log('文件已上传');
            data = novel;
        }
        else {
            const { meta, catalog, chapters } = await novelService.parse(file);
            await novelService.saveNovel(meta, catalog, chapters);

            data = meta;
        }

        res.status(200).json<Novel>({
            message: '文件上传成功',
            data,
        })
    }
    catch (UPLOAD_MERGE_ERROR) {
        console.log('Function: handleUploadMerge', UPLOAD_MERGE_ERROR);
        next(UPLOAD_MERGE_ERROR);
    }
    finally {
        // 无论成功与否，都移除合并的文件
        if (file) {
            await fs.unlink(file);
        }
    }
}