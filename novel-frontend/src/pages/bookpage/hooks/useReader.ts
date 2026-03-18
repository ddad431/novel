import { ref, computed, watch, Ref, Raw } from 'vue';
import { type Page, type Line, calcPages } from '@/reader/reader';
import { useReaderPageConfig } from './useReaderPageConfig';
import { type Book, BookShelfStore, type Catalog, catalogStore, chapterStore } from '@/store';
import { fetchNovelCatalog, fetchNovelChapter } from '@/services/apis/novel.api';
import { useBookHisotry, useBookshelf } from '@/pages/home/hooks';
import { BookHistoryStorage } from '@/store/history';

type RawChapters = Record<'prev' | 'cur' | 'next', {
    title: string,
    content: string[],
}>;

type Chapters = Record<'prev' | 'cur' | 'next', {
    title: string,
    pages: Page[],
}>;

type Pages = Record<'prev' | 'cur' | 'next', {
    title: string,
    lines: Line[],
}>;


/**
 * 当前章节索引
 */
const curChapterIndex = ref<number>(0);

/**
 * 当前页索引
 */
const curPageIndex = ref<number>(0);

/**
 * 小说目录
 */
const catalog = ref<Catalog>();

/**
 * 加载到内存的三章未处理的内容（用于辅助计算。调整布局、字体大小时重新计算 chapters 需要原本的 content）
 */
const rawChapters = ref<RawChapters>({
    prev: { title: '', content: [] },
    cur:  { title: '', content: [] },
    next: { title: '', content: [] },
});

/**
 * 加载到内存的三章内容
 */
const chapters = ref<Chapters>({
    prev: { title: '', pages: [] },
    cur:  { title: '', pages: [] },
    next: { title: '', pages: [] },
});

/**
 * 渲染的三页内容
 */
const pages: Ref<Pages> = computed(() => {
    const { cur: curChapter, next: nextChapter, prev: prevChapter } = chapters.value;

    return {
        cur: {
            title: curChapter.title,
            lines: curChapter.pages[curPageIndex.value],
        },
        prev: {
            title: isChapterFirstPage.value ? prevChapter.title : curChapter.title,
            lines: isChapterFirstPage.value ? prevChapter.pages[prevChapter.pages.length - 1] : curChapter.pages[curPageIndex.value - 1],
        },
        next: {
            title: isChapterLastPage.value ? nextChapter.title : curChapter.title,
            lines: isChapterLastPage.value ? nextChapter.pages[0] : curChapter.pages[curPageIndex.value + 1]
        }
    }
});

const isChapterFirstPage = computed(() => curPageIndex.value === 0);
const isChapterLastPage = computed(() => curPageIndex.value === chapters.value.cur.pages.length - 1);
const isFirstChapter = computed(() => curChapterIndex.value === 0);
const isLastChapter = computed(() => curChapterIndex.value + 1 === catalog.value?.length );
const isFirstChapterFirstPage = computed(() => curChapterIndex.value === 0 && curPageIndex.value === 0);
const isLastChapterLastPage = computed(() => curChapterIndex.value + 1 === catalog.value?.length && curPageIndex.value + 1 === chapters.value.cur.pages.length);

export function useReader(book: Ref<Book>) {
    // dependicies
    const { curFontSize, readerPageConfig } = useReaderPageConfig();
    const { bookshelf } = useBookshelf();       // 同步阅读进度
    const { bookhistorys } = useBookHisotry();  // 同步阅读进度

    // states
    const pageProgress = computed(() => {
        return function (key: 'cur' | 'prev' | 'next') {
            switch (key) {
                case 'cur': {
                    return `${curPageIndex.value + 1}/${chapters.value.cur.pages.length}`;
                }
                case 'prev': {
                    if (isFirstChapter.value) {
                        return '';
                    }
                    return isChapterFirstPage.value ? `${chapters.value.prev.pages.length}/${chapters.value.prev.pages.length}` : `${curPageIndex.value + 1 - 1}/${chapters.value.cur.pages.length}`;
                }
                case 'next': {
                    if (isLastChapter.value) {
                        return '';
                    } 
                    return isChapterLastPage.value ? `1/${chapters.value.next.pages.length}` : `${curPageIndex.value + 1 + 1}/${chapters.value.cur.pages.length}`;
                }
            }
        }
    });
    const chapterProgress = computed(() => {
        const total = catalog.value?.length;
        
        return function (key: 'prev' | 'cur' | 'next') {
            switch (key) {
                case 'cur': {
                    return `${((curChapterIndex.value / total! + (curPageIndex.value + 1) / (chapters.value.cur.pages.length * total!))*100).toFixed(2)}%`
                }
                case 'prev': {
                    if (isFirstChapter.value) {
                        return '';;
                    }
                    return isChapterFirstPage.value
                        ? `${(((curChapterIndex.value - 1) / total!)*100).toFixed(2)}%`
                        : `${(((curChapterIndex.value - 1) / total! + (curChapterIndex.value + 1) / (chapters.value.cur.pages.length * total!))*100).toFixed(2)}%`;
                }
                case 'next': {
                    if (isLastChapter.value) {
                        return '';
                    }
                    return isChapterLastPage.value
                        ? `${(((curChapterIndex.value + 1) / total! + 1 / (chapters.value.next.pages.length * total!))*100).toFixed(2)}%`
                        : `${(((curChapterIndex.value) / total! + (curPageIndex.value +2) / (chapters.value.cur.pages.length * total!))*100).toFixed(2)}%`
                }
            }
        }
    });

    // lifetime
    watch(curFontSize, () => {
        updatePages();
    });

    watch(curChapterIndex, (value) => {
        saveReadProgress(value + 1);
    })

    // actions
    async function getNovelCatalog({origin, id}: {origin: string, id: string}) {
        const record = await catalogStore.get([origin, id]);
    
        if (!record) {
            const res = await fetchNovelCatalog({origin, id});
            if (res.data && res.data.length > 0) {
                catalogStore.set({origin, id, catalog: res.data});
            }

            return res.data;
        }
        return record.catalog;
    }

    async function getNovelChapter(chapter: number) {
        console.log('chapter:', chapter);
        const { origin, id } = book.value;
        const { title, cid } = catalog.value![chapter-1];

        const cache = await chapterStore.get([origin, id, cid]);
        if (cache) {
            return { title, content: cache.content };
        }

        try {
            const res = await fetchNovelChapter({origin, id, cid});
            await chapterStore.set({origin, id, cid, content: res.data});
            return { title, content: res.data };
        }
        catch (err) {
            console.log(`第 ${chapter} 章失败`);
            return { title, content: ["章节内容加载失败..."] };
        }
    }

    async function gotoChapter(progress: number) {
        curChapterIndex.value = progress - 1;

        rawChapters.value = await getNovelChapters({origin: book.value.origin, id: book.value.id, progress, catalog: catalog.value!});
        const { cur, next, prev } = rawChapters.value;
        chapters.value = {
            cur: {
                title: rawChapters.value.cur.title,
                pages: calcPages(cur.title, cur.content, readerPageConfig.value)
            },
            prev: {
                title: prev.title,
                pages: calcPages(prev.title, prev.content, readerPageConfig.value)
            },
            next: {
                title: next.title,
                pages: calcPages(next.title, next.content, readerPageConfig.value)
            }
        }

        curPageIndex.value = 0;
        saveReadProgress(curChapterIndex.value + 1);
    }

    async function getNovelChapters({origin, id, progress, catalog}: {origin: string, id: string, progress: number, catalog: Catalog}): Promise<RawChapters> {
        const curIdx = Math.max(0, progress - 1); // 0 是未读，与进度为 1 一样
        const prevIdx = curIdx - 1;
        const nextIdx = curIdx + 1;
        const getNovelChapter = async (index: number) => {     
            if (index < 0 || index >= catalog.length) {
                return { title: '', content: [''] };
            }

            const cid = catalog[index].cid;
            const title = catalog[index].title;
            const cache = await chapterStore.get([origin, id, cid]);    // 这是异步，别特么忘了写 await
            if (cache) {
                return { title, content: cache.content };
            }

            try {
                const res = await fetchNovelChapter({origin, id, cid});
                await chapterStore.set({origin, id, cid, content: res.data});   //  这是异步，别特么忘了写 await

                return { title, content: res.data };
            }
            catch (err) {
                console.log(`第 ${Math.max(1, progress)} 章失败`);
                return { title, content: ["章节内容加载失败..."] };
            }
        }

        const [prev, cur, next] = await Promise.all([
            getNovelChapter(prevIdx),
            getNovelChapter(curIdx),
            getNovelChapter(nextIdx),
        ])

        return { prev, cur, next };
    }

    async function initNovelCatalog() {
        try {
            catalog.value = await getNovelCatalog({origin: book.value.origin, id: book.value.id});
        }
        catch (err) {
            console.log('init novel catalog fail:', err);
            throw err;
        }

        if (book.value.total === 0) {
            syncNovelTotal();
        }
    }

    async function initNovelChapters() {
        try {
            curChapterIndex.value = Math.max(0, book.value.progress - 1); // 注意 progress 为 0 的情况

            rawChapters.value = await getNovelChapters({origin: book.value.origin, id: book.value.id, progress: book.value.progress, catalog: catalog.value!});
            const { cur, next, prev } = rawChapters.value;
            chapters.value = {
                cur: {
                    title: rawChapters.value.cur.title,
                    pages: calcPages(cur.title, cur.content, readerPageConfig.value)
                },
                prev: {
                    title: prev.title,
                    pages: calcPages(prev.title, prev.content, readerPageConfig.value)
                },
                next: {
                    title: next.title,
                    pages: calcPages(next.title, next.content, readerPageConfig.value)
                }
            }

            saveReadProgress(curChapterIndex.value + 1);
        }
        catch (err) {
            throw err;
        }
    }

    function resetNovelChapters() {
        chapters.value = {
            prev: { title: '', pages: [] },
            cur:  { title: '', pages: [] },
            next: { title: '', pages: [] },
        };
    }

    function syncNovelTotal() {
        // 两个地方：书架和历史
        const shelfBook = book.value.group
            ? (bookshelf.value.find(v => v.type === 'group' && v.name == book.value.group)?.data as Book[])?.find(v => v.origin === book.value.origin && v.id === book.value.id)
            : bookshelf.value.find(v => v.type === 'book' && v.data.origin === book.value.origin && v.data.id === book.value.id)?.data as Book
        if (shelfBook) {
            shelfBook.total = catalog.value?.length!;
        }
        BookShelfStore.updateBookshelf(bookshelf.value);


        const historyBook = bookhistorys.value.find(v => v.origin === book.value.origin && v.id === book.value.id);
        if (historyBook) {
            historyBook.total = catalog.value?.length!;
        }
        BookHistoryStorage.updateBookHistory(bookhistorys.value);
    }

    function saveReadProgress(progress: number) {
        // 保存时机
        //   - curChapterIndex 更新
        //   - 从封面页进来，即 progress 为 0。（这时要立即更新，不然用户退出去了，重新进入又来到封面页）
        // 
        // 保存后还需要同步给哪里？
        //   - 书架
        //   - 历史
        //
        // 想法？这个 book 可以做成全局的。一更新就自动保存。
        const shelfBook = book.value.group
            ? (bookshelf.value.find(v => v.type === 'group' && v.name == book.value.group)?.data as Book[])?.find(v => v.origin === book.value.origin && v.id === book.value.id)
            : bookshelf.value.find(v => v.type === 'book' && v.data.origin === book.value.origin && v.data.id === book.value.id)?.data as Book
        if (shelfBook) {
            shelfBook.progress = progress;
        }
        BookShelfStore.updateBookshelf(bookshelf.value);


        const historyBook = bookhistorys.value.find(v => v.origin === book.value.origin && v.id === book.value.id);
        if (historyBook) {
            historyBook.progress = progress;
        }
        BookHistoryStorage.updateBookHistory(bookhistorys.value);
    }

    async function goNextPage() {
        if (!isChapterLastPage.value) {
            curPageIndex.value += 1;
            return;
        }

        if (isLastChapter.value) {
            uni.showToast({ title: '没有下一页了', icon: 'error', mask: false });
            return;
        }

        curChapterIndex.value += 1;
        chapters.value.prev = chapters.value.cur;
        chapters.value.cur = chapters.value.next;
        curPageIndex.value = 0;

        rawChapters.value.prev = rawChapters.value.cur;
        rawChapters.value.cur = rawChapters.value.next;

        // TODO 保存进度

        const curChapter = curChapterIndex.value + 1;   // NOTE 在更新 cur 后请求新章节，防止阻塞 UI
        if (curChapter + 1 <= catalog.value?.length!) {
            const nextChapter = await getNovelChapter(curChapter + 1);
            rawChapters.value.next = nextChapter;  // NOTE 别忘了更新 rawChapters, 调整字体、布局时需要重新计算整个 chapters
            chapters.value.next = { title: nextChapter.title, pages: calcPages(nextChapter.title, nextChapter.content, readerPageConfig.value)};
        }
    }

    async function goPrevPage() {
        if (!isChapterFirstPage.value) {
            curPageIndex.value -= 1;
            return;
        }

        if (isFirstChapter.value) {
            uni.showToast({ title: '已经是第一页了', icon: 'error', mask: false });
            return;
        }

        curChapterIndex.value = Math.max(0, curChapterIndex.value - 1); // NOTE 负数情况
        chapters.value.next = chapters.value.cur;
        chapters.value.cur = chapters.value.prev;
        curPageIndex.value = chapters.value.cur.pages.length - 1;

        rawChapters.value.next = rawChapters.value.cur;
        rawChapters.value.cur = rawChapters.value.prev;

        // TODO 保存进度

        const newChapter = await getNovelChapter(curChapterIndex.value + 1);
        rawChapters.value.prev = newChapter;
        chapters.value.prev = { title: newChapter.title, pages: calcPages(newChapter.title, newChapter.content, readerPageConfig.value)}

        return;
    }

    async function updatePages() {
        // NOTE
        // - 更新 pages 时，也要更新 curPageIndex，不然会出现空白页（例如 36 号字体 25 页，而 18 号字体没有 25 页）
        //  - 字体放大 -> curPageIndex 不变
        //  - 字体缩小 -> curpageIndex 按比例同步
        const progress = (curPageIndex.value + 1) / chapters.value.cur.pages.length;
        const oldPageNums = chapters.value.cur.pages.length;

        chapters.value.cur.pages = calcPages(chapters.value.cur.title, rawChapters.value.cur.content, readerPageConfig.value);
        chapters.value.prev.pages = calcPages(chapters.value.prev.title, rawChapters.value.prev.content, readerPageConfig.value);
        chapters.value.next.pages = calcPages(chapters.value.next.title, rawChapters.value.next.content, readerPageConfig.value);

        const newPageNums = chapters.value.cur.pages.length;
        if (newPageNums < oldPageNums) {
            curPageIndex.value = Math.floor((newPageNums -1) * progress);   
        }
    }

    return {
        curChapterIndex,
        curPageIndex,
        catalog,
        pages,
        chapters,
        isFirstChapterFirstPage,
        isLastChapterLastPage,
        pageProgress,
        chapterProgress,
        initNovelCatalog,
        initNovelChapters,
        resetNovelChapters,
        gotoChapter,
        updatePages,
        goNextPage,
        goPrevPage,
    };
}