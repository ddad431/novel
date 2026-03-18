import { DBSchema } from "idb";

export type Catalog = Array<{
    cid: string,
    title: string,
}>;

export type CatalogStroageKey = [
    origin: string,
    id: string,
];

export type CatalogStorageRecord = {
    origin: string,
    id: string,
    catalog: Catalog,
};

export type Chapter = string[];

export type ChapterStorageKey = [
    origin: string,
    id: string,
    cid: string,
];

export type ChapterStorageRecord = {
    origin: string,
    id: string,
    cid: string,
    content: Chapter,
};

type NoIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};

type CONFIG<T extends NoIndexSignature<NovelDB>, K extends keyof T = keyof T> = {
    [P in K]: {
        /** indexDB 表名 */
        name: P;
        /** idexDB 表主键 */
        keyPath: (keyof Extract<T[P], { value: any }>['value'])[]; // 使用 Extract 确保 T[P] 必须包含 value 属性
    };
}[K][];

export const STORE_CONFIG: CONFIG<NoIndexSignature<NovelDB>, keyof NoIndexSignature<NovelDB>> = [
    { name: 'catalogs', keyPath: ['origin', 'id']},
    { name: 'chapters', keyPath: ['origin', 'id', 'cid']},
];

export interface NovelDB extends DBSchema {
    'catalogs': {
        key: CatalogStroageKey,
        value: CatalogStorageRecord,
    },
    'chapters': {
        key: ChapterStorageKey,
        value: ChapterStorageRecord,
    }
}