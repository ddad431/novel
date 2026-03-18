import { IDBPDatabase, openDB } from 'idb';
import { NovelDB, STORE_CONFIG } from './types';

const DB_NAME = 'NOVEL_DB';
const VERSION = 1;
let dbPromise: Promise<IDBPDatabase<NovelDB>> | null = null;

export async function connection(): Promise<any> {
    if (dbPromise) {
        // TODO 处理 openDB 失败的情况（直接上抛？还是重试几次再上抛？）
        return dbPromise;
    }

    dbPromise = openDB<NovelDB>(DB_NAME, VERSION, {
        upgrade(db) {
            STORE_CONFIG.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath });
                }
            })
        },
        terminated() {
            // NOTE 防止连接突然断开时，访问不存在的旧实例。
            dbPromise = null;
        }
    })

    return dbPromise;
}
