import { BookShelfStore } from './bookshelf';

type NovelChapterStorage = Array<{
    bookId: string,
    list: Array<{
        chapterId: number,
        title: string,
        content: string,
    }>,
}>;

type ResponseNovelChapter = {
    message: string,
    data: ResponseNovelChapterData,
};

type ResponseNovelChapterData = Array<{
    id: string,
    index: number,
    title: string,
    content: string,
}>;

export const ChapterStore = {
    getLocalChapters,
    updateLocalChapters,
    getNovelChapter,
    goToChapter,
};

function getLocalChapters(): NovelChapterStorage {
    return JSON.parse(uni.getStorageSync('chapters') || '[]');
}

function updateLocalChapters(data: ResponseNovelChapterData) {
    try {
        const localChapters = getLocalChapters();
        const { id } = data[0];
        const bookRecord = localChapters.find(v => v.bookId === id);
        const chapters = data.map(v => ({ chapterId: v.index, title: v.title, content: v.content }));

        if (!bookRecord || !bookRecord?.list) {
            localChapters.push({ bookId: id, list: chapters });
            uni.setStorageSync('chapters', JSON.stringify(localChapters));

            return;
        }

        const tmpMap = new Map(bookRecord.list.map(v => [v.chapterId, v]));
        for (const value of chapters) {
            tmpMap.set(value.chapterId, value);
        }
        bookRecord.list = Array.from(tmpMap.values());

        uni.setStorageSync('chapters', JSON.stringify(localChapters));
    }
    catch (err) {
        console.log('更新本地章节数据失败', err);
    }
}

async function getNovelChapter(
    url: string,
    { id, start, count }: { id: string, start: number, count: number }
): Promise<ResponseNovelChapter> {
    // #ifdef H5
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, start, count })
        });

        return res.json();
    }
    catch (err) {
        console.error('请求小说章节失败', err);

        return {} as ResponseNovelChapter;
    }
    // #endif
}

async function getNovelChapters(orgin: string, id: string, cids: string[]) {
    // 思路
    // 1. 有缓存
    //      - 缓存数据足够 -> 读取缓存
    //      - 缓存数据不够 -> 请求
    // 2. 没缓存
    //      1) 请求三章（首章、尾章特殊处理）
    //      2) 
}

async function goToChapter(id: string, chapter: number) {
    const total = BookShelfStore.getBookById(id)?.total as number;
    const isFirst = chapter === 1;
    const isLast = chapter === total;
    const reqCount = 9;


    // (1) 获取足够的章节记录
    const bookRecord = getLocalChapters().find(v => v.bookId === id);
    function isEnoughChapterRecord() {
        const bookRecord = getLocalChapters().find(v => v.bookId === id); // 确保拿到最新的记录
        const chapters = isFirst
            ? [chapter - 1, chapter]
            : isLast ? [chapter - 2, chapter - 1] : [chapter - 2, chapter - 1, chapter];

        return chapters.every(item => bookRecord?.list.map(v => v.chapterId).includes(item));
    }

    // (1.1) 没有小说记录
    //       - 请求 [当前章, 当前章 + 9]
    if (!bookRecord || !bookRecord?.list) {
        const startChapter = chapter;
        const count = startChapter + reqCount <= total ? reqCount : reqCount - (total - (startChapter + reqCount));
        const { data } = await getNovelChapter('http://localhost:3000/novel', { id, start: startChapter, count });

        updateLocalChapters(data);
    }

    // (1.2) 没有足够的章节记录（前一章、当前章、后一章）
    //       - 首章：请求 [当前章, 当前章 + 9]
    //       - 中间章：请求 [前一章，前一章 + 9]
    //       - 尾章：请求 [前一章， 当前章]
    if (!isEnoughChapterRecord()) {
        console.log('not enough');
        const startChapter = isFirst ? chapter : chapter - 1;
        const count = isLast
            ? 2
            : startChapter + reqCount <= total ? reqCount : reqCount - (total - (startChapter + reqCount));
        const { data } = await getNovelChapter('http://localhost:3000/novel', { id, start: startChapter, count });

        updateLocalChapters(data);
    }

    // (2) 读取最新的章节记录
    const chapterRecord = getLocalChapters().find(v => v.bookId === id)?.list;

    // (3) 携带数据跳转到 bookpage
    const chapters = chapterRecord
        ?.filter(v => [chapter - 2, chapter - 1, chapter].includes(v.chapterId))
        ?.sort((a, b) => a.chapterId - b.chapterId);
    const query = encodeURIComponent(JSON.stringify(chapters));

    uni.navigateTo({ url: `/pages/bookpage/bookpage?data=${query}&from=bookcover` });
}