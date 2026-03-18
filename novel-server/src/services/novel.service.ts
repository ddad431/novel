import { _parse, type NovelParseConfig } from '../core/parser';
import { fetchNovelSearchList, fetchNovelCatalog, fetchNovelChapter } from '../core/tasks';
import { Novel, NovelCatalog, NovelChapter } from '../models/core';
import { novelRepository } from '../repositories'

export class NovelService {
    public async parse(file: string, config?: NovelParseConfig) {
        return _parse(file, config);
    }

    public async getNovel(origin: string, id: string) {
        try {
            const result = await novelRepository.findNovel(origin, id);
            return result;
        }
        catch (DB_FIND_ERROR) {
            console.log(DB_FIND_ERROR);
            throw DB_FIND_ERROR;
        }
    }

    public async getNovelSearchList(keyword: string) {
        try {
            const result = await fetchNovelSearchList(keyword);
            return result;
        }
        catch (FETCH_ERROR) {
            // TODO: 错误分类 ？
            throw FETCH_ERROR;
        }
    }

    public async getNovelCatalog(origin: string, id: string) {
        let result = null;

        // result = await novelRepository.findNovelCatalog(origin, id);
        // if (result) {
        //     return result;
        // }

        try {
            result = await fetchNovelCatalog(origin, id);

            // try {
            //     await novelRepository.saveNovelCatalog(origin, id, result);
            // }
            // catch (DB_SAVE_ERROR) {
            //     // TODO: 错误分类 ？
            //     throw DB_SAVE_ERROR;
            // }

            return result;

        }
        catch (FETCH_ERROR) {
            // TODO: 错误分类 ？
            throw FETCH_ERROR;
        }
    }

    public async getNovelChapter(origin: string, id: string, cid: string) {
        let result = null;

        // result = await novelRepository.findNovelChapter(origin, id, cid);
        // if (result) {
        //     return result;
        // }s

        try {
            result = await fetchNovelChapter(origin, id, cid);

            // try {
            //     await novelRepository.saveNovelChapter(origin, id, cid, result);
            // }
            // catch (DB_SAVE_ERROR) {
            //     // TODO: 这里只记录日志，不要 throw 上抛中断流程。（对吗？？感觉不太对？要是需要保证小说保存顺序呢？）
            // }

            return result;
        }
        catch (FETCH_ERROR) {
            // TODO: 错误分类 ？
            throw FETCH_ERROR;
        }
    }

    public async saveNovel(meta: Novel, catalog: NovelCatalog, chapters: NovelChapter[]) {
        try {
            console.log('Function: save Novel');
            await novelRepository.saveNovel(meta, catalog, chapters);
        }
        catch (DB_SAVE_ERROR) {
            // TODO: 错误分类 ？
            throw DB_SAVE_ERROR;
        }
    }

    public async saveNovelMeta(novel: Novel) {
        try {
            console.log('Function: save Novel Meta');
            await novelRepository.saveNovelMeta(novel);
        }
        catch (DB_SAVE_ERROR) {
            // TODO: 错误分类 ？
           throw DB_SAVE_ERROR;
        }
    }

    public async saveNovelCatalog(origin: string, id: string, catalog: NovelCatalog) {
        try {
            console.log('Function: save NovelCatalog');
            await novelRepository.saveNovelCatalog(origin, id, catalog);
        }
        catch (DB_SAVE_ERROR) {
            // TODO: 错误分类 ？
            throw DB_SAVE_ERROR;
        }
    }

    public async saveNovelChapter(origin: string, id: string, cid: string, chapter: NovelChapter) {
        try {
            console.log('Function: save NovleChapter');
            await novelRepository.saveNovelChapter(origin, id, cid, chapter);
        }
        catch (DB_SAVE_ERROR) {
            // TODO: 错误分类 ？
            throw DB_SAVE_ERROR;
        }
    }
}

export const novelService = new NovelService();