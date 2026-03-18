import type { Novel, NovelCatalog, NovelChapter } from '../models/core';
import type { NovelCatalogModel, NovelChapterModel, NovelChapterCreateManyInput, NovelModel } from '../../prisma/generated/prisma/models';
import { prisma } from '../utils/prisma';

class NovelRepository {
    public async findNovel(origin: string, id: string): Promise<Novel | null> {
        let record: NovelModel | null = await prisma.novel.findUnique({
            where: {
                origin_id: {
                    origin,
                    id,
                }
            }
        });

        if (!record) {
            return null;
        }

        const { createAt, updateAt, ...novel} = record;
        return novel as Novel;
    }
    
    public async findNovelCatalog(origin: string, id: string): Promise<NovelCatalog | null> {
        const record: NovelCatalogModel | null = await prisma.novelCatalog.findUnique({
            where: {
                novelOrigin_novelId: {
                    novelId: id,
                    novelOrigin: origin,
                }
            }
        })

        if (!record) {
            return null;
        }

        return record.content as NovelCatalog;
    }

    public async findNovelChapter(origin: string, id: string, cid: string): Promise<NovelChapter | null> {
        const chapter: NovelChapterModel | null = await prisma.novelChapter.findUnique({
            where: {
                novelOrigin_novelId_cid: {
                    novelOrigin: origin,
                    novelId: id,
                    cid,
                }
            }
        })

        if (!chapter) {
            return null;
        }

        return chapter.content as NovelChapter;
    }

    public async saveNovel(meta: Novel, catalog: NovelCatalog, chapters: NovelChapter[]) {
        return await prisma.$transaction(async (tx) => {
            await this.saveNovelMeta(meta, tx);
            await this.saveNovelCatalog(meta.origin, meta.id, catalog, tx);

            // NOTE 
            // - 使用 createMany 而不是并发 upsert
            // - 并发 upsert 太慢了，事务有时 10000ms 都完成不了...
            // 
            //      const promises = chapters.map((content, i) => this.saveNovelChapter(meta.source, meta.id, catalog[i].cid, content, tx));
            //      await Promise.all(promises);
            //
            const chaptersRecord: NovelChapterCreateManyInput[] = chapters.map((chapter, index) => ({
                content: chapter,
                novelOrigin: meta.origin,
                novelId: meta.id,
                cid: catalog[index].cid,
            }));
            await tx.novelChapter.createMany({ data: chaptersRecord });
        }, {
            timeout: 20000,
        })
    }

    public async saveNovelMeta(data: Novel, client?: any) {
        client = client ? client : prisma; // 全局 Prisma Client or 事务上下文 tx (transaction)
        await client.novel.upsert({
            where: {
                origin_id: {
                    origin: data.origin,
                    id: data.id,
                }
            },
            create: {
                source: data.source,
                origin: data.origin,
                id: data.id,
                cover: data.cover,
                name: data.name,
                author: data.author,
                desc: data.desc,
                status: data.status,
                tag: data.tag,
                total: data.total,
            },
            update: {
                cover: data.cover,
                name: data.name,
                author: data.author,
                desc: data.desc,
                status: data.status,
                tag: data.tag,
                total: data.total,
            }
        })
    }

    public async saveNovelCatalog(origin: string, id: string, data: NovelCatalog, client?: any) {
        client = client ? client : prisma; // 全局 Prisma Client or 事务上下文 tx (transaction)
        await client.novelCatalog.upsert({ // TODO: 这里的 client 没有收窄，导致类型推断失效
            where: {
                novelOrigin_novelId: {
                    novelOrigin: origin,
                    novelId: id,
                }
            },
            create: {
                content: data,
                novelOrigin: origin,
                novelId: id,
            },
            update: {
                content: data,
            }
        })
    }

    public async saveNovelChapter(origin: string, id: string, cid: string, data: NovelChapter, client?: any) {
        client = client ? client : prisma; // 全局 Prisma Client or 事务上下文 tx (transaction)
        await client.novelChapter.upsert({
            where: {
                novelOrigin_novelId_cid: {
                    novelOrigin: origin,
                    novelId: id,
                    cid,
                }
            },
            update: {
                content: data,
            },
            create: {
                content: data,
                cid,
                novelOrigin: origin,
                novelId: id,
            }
        })
    }

}

export const novelRepository = new NovelRepository();