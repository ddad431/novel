import { connection } from "./connection";
import { NovelDB } from "./types";

type NoIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};

function createStore<T extends NoIndexSignature<NovelDB>, K extends keyof NoIndexSignature<NovelDB>>(store: K) {
    return {
        async get(key: T[K]['key']) {
            try {
                const db = await connection();
                return await db.get(store, key);
            } catch (e) {
                console.error("读取数据库失败，可能是连接已关闭", e);
                return null; 
            }
        },

        async set(data: T[K]['value']) {
            (await connection()).put(store, data);
        },

        async setAll(items: T[K]['value'][]) {
            const db = await connection();
            const tx = db.transaction(store, 'readwrite');
            const os = tx.objectStore(store);

            try {
                await Promise.all([
                    ...items.map(item => os.put(item)),
                    tx.done
                ]);
            } catch (e) {
                console.error(`批量写入 ${store} 失败:`, e);
                tx.abort(); // 回滚
            }
        },

        async delete(key: T[K]['key']) {
            (await connection()).delete(store, key);
        },

        async deleteAll(keys: T[K]['key'][]) {
            const db = await connection();
            const tx = db.transaction(store, 'readwrite');
            const os = tx.objectStore(store);

            try {
                await Promise.all([
                    ...keys.map(key => os.delete(key)),
                    tx.done
                ]);
            } catch (e) {
                console.error(`批量删除 ${store} 失败:`, e);
                tx.abort(); // 回滚
            }
        },

        async clear() {
            (await connection()).clear(store);
        }
    }
}

export * from './types';
export const catalogStore = createStore('catalogs');
export const chapterStore = createStore('chapters');