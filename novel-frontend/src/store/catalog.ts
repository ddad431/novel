// import { openDB, DBSchema, IDBPDatabase } from 'idb';

// export type NovelCatalog = Array<{
//     cid: string,
//     title: string,
// }>;

// export type NovelCatalogStorage = {
//     origin: string,
//     id: string,
//     catalog: NovelCatalog,
// };

// interface SelfDB extends DBSchema {
//     catalogs: {
//         key: [string, string],
//         value: NovelCatalogStorage,
//     }
// }

// const DB_NAME = 'NOVEL_DB';
// const VERSION = 1;
// const STORE_NAME = 'catalogs'

// let _db: Promise<IDBPDatabase<SelfDB>> | null = null;

// async function getConnection() {
//     if (_db) {
//         return _db;
//     }

//     _db = openDB<SelfDB>(DB_NAME, VERSION, {
//         upgrade(db) {
//             if (!db.objectStoreNames.contains(STORE_NAME)) {
//                 db.createObjectStore(STORE_NAME, {keyPath: ['origin', 'id']});
//             }
//         }
//     })

//     return _db;
// }

// export const catalogStorage = {
//     async set(data: SelfDB['catalogs']['value']) {
//         const db = await getConnection();
        
//         return db.put(STORE_NAME, data)
//     },

//     async get({origin, id}: {origin: string, id: string}) {
//         const db = await getConnection();

//         return db.get(STORE_NAME, [origin, id]);
//     },

//     async delete({origin, id}: {origin: string, id: string}) {
//         const db = await getConnection();

//         return db.delete(STORE_NAME, [origin, id])
//     },

//     async clear() {
//         const db = await getConnection();

//         db.clear(STORE_NAME);
//     }
// }
