import { useBookHisotry } from "@/pages/home/hooks";
import { BookHistoryStorage } from "./history";

export type BookShelfBook = { 
    type: 'book',
    data: Book,
    selected: boolean,
    pinned: boolean,
};
export type BookShelfGroup = {
    type: 'group',
    name: string,
    data: Book[],
    selected: boolean,
    pinned: boolean,
}
export type BookShelfItem = BookShelfBook | BookShelfGroup;
export type BookShelf = BookShelfItem[];

export type Book = Novel & {
    /** 小说进度（本地） */
    progress: number,

    /** 小说页进度 */
    pageProgress: number,

    /** 小说选中状态（本地，小说管理） */
    select: boolean,

    /** 小说是否加入到了书架（本地） */
    isadded: boolean,

    /** 小说是否置顶（TODO：分组内书籍置顶？） */
    ispined: boolean,

    /** 小说所在分组 */
    group: string,

    /** 小说访问时间 */
    visit: number,
};
export type Novel = {
    /** 小说来源 （本地为 '本地'，书源为爬取网站名）*/
    source: string,

    /** 小说网站 (本地为 'local', 书源为爬取网站 origin */
    origin: string,

    /** 小说 ID （本地为生成的 ID，书源为爬取的小说 ID）*/
    id: string,

    /** 小说书名（本地为上传的文件名，书源为爬取的小说名*/
    name: string,

    /** 小说作者 */
    author: string,

    /** 小说简介 */
    desc: string,

    /** 小说封面（本地为 '', 书源为爬取的封面地址）*/
    cover: string,

    /** 小说状态 (TODO: 可能书源获取的 state 是 '连载中' 这种，可能需要一些额外的转换？) */
    status: '连载' | '完结' | '本地',

    /** 小说分类 (TODO: 可能书源获取的小说的有多个 tag？*/
    tag: string,

    /** 小说总章节数 （配置本地的 process 显示进度）*/
    total: number,
};

export const BookShelfStore = {
    getBookshelf,
    updateBookshelf,
    findBook,
    addBook,
    removeBook,
    updateBook,
    togglePinBook,
    renameGroup,
    findGroup,
    addGroup,
    removeGroup,
    cleanGroup,
    addGroupBook,
    removeGroupBook,
    moveGroupBookToBookshelf,
    moveBookToGroup,
    changeBookGroup,
};

const { bookhistorys } = useBookHisotry();

function getBookshelf(): BookShelf {
    return JSON.parse(uni.getStorageSync('bookshelf') || '[]');
}

function updateBookshelf(bookshelf: BookShelf) {
    try {
        uni.setStorageSync('bookshelf', JSON.stringify(bookshelf));
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}

function findBook(origin: string, id: string) {
    const bookshelf = getBookshelf();

    return bookshelf.find(v => v.type === 'book' && v.data.id === id && v.data.origin === origin) as (BookShelfBook | undefined);
}

function addBook(book: Book) {
    const bookshelf = getBookshelf();
    if (bookshelf.find(v => v.type === 'book' && v.data.id === book.id && v.data.origin === book.origin)) {
        return;
    }
    
    book.isadded = true;
    book.visit = Date.now();

    const shelfBook: BookShelfBook = { type: 'book', data: book, selected: false, pinned: false};
    bookshelf.push(shelfBook);
    updateBookshelf(bookshelf);
}

function removeBook(books: BookShelfItem[]): BookShelf {
    const bookshelf = getBookshelf();
    const newBookShelf = [] as BookShelf;

    const _books = books.filter(v => v.type === 'book');    
    const _groups = books.filter(v => v.type === 'group').map(v => v.name);
    
    bookshelf.forEach((value) => {
        if (value.type === 'group') {
            if (!_groups.includes(value.name)) {
                newBookShelf.push(value);
            }
            return;
        }
        
        if (!_books.find(v => v.data.origin === value.data.origin && v.data.id === value.data.id)) {
            newBookShelf.push(value);
        }
    })

    updateBookshelf(newBookShelf);
    return newBookShelf;
}

function updateBook(data: Book) {
    const bookshelf = getBookshelf();
    const index = bookshelf.findIndex(v => v.type === 'book' &&  v.data.id === data.id && v.data.origin === origin);
    if (index === -1) {
        return;
    }
    
    bookshelf[index] = { type: 'book', data, selected: false, pinned: false};
    updateBookshelf(bookshelf);
}

function togglePinBook(book: BookShelfBook | BookShelfGroup) {
    book.pinned = !book.pinned;
    const bookshelf = removeBook([book]);

    if (book.pinned) {
        bookshelf.unshift(book)
    }
    else {
        bookshelf.push(book);
    }

    updateBookshelf(bookshelf);
}

function findGroup(name: string) {
    const bookshelf = getBookshelf();
    
    return bookshelf.find(v => v.type === 'group' && v.name === name) as (BookShelfGroup | undefined);
}

function addGroup(name: string, books: Book[]) {
    const bookshelf = getBookshelf();
    const shelfGroup: BookShelfGroup = { type: 'group', name, data: books, pinned: false, selected: false };

    bookshelf.push(shelfGroup)
    updateBookshelf(bookshelf);
}

function removeGroup(name: string) {   
    const bookshelf = getBookshelf();
    const newBookShelf = bookshelf.filter(v => !(v.type === 'group' && v.name === name));

    updateBookshelf(newBookShelf);

    // 阅读历史要更新对应书籍的添加状态
    const group = bookshelf.find(v => v.type === 'group' && v.name === name) as BookShelfGroup;
    group.data.forEach(v => {
        const record = bookhistorys.value.find(u => u.origin === v.origin && u.id === v.id);
        if (record) {
            record.isadded = false;
        }
    })
    BookHistoryStorage.updateBookHistory(bookhistorys.value);
}

function renameGroup(oldName: string, newName: string) {
    const bookshelf = getBookshelf();
    const group = bookshelf.find(v => v.type === 'group' && v.name === oldName) as BookShelfGroup;

    group.data.forEach(v => v.group = newName);
    group.name = newName;

    updateBookshelf(bookshelf);
}

function cleanGroup(name: string) {
    const bookshelf = getBookshelf();
    const group = bookshelf.find(v => v.type === 'group' && v.name === name) as BookShelfGroup;
    const books: BookShelfBook[] = group.data.map(v => ({ type: 'book', data: {...v, group: ''}, selected: false, pinned: false }));

    group.data = [];
    bookshelf.push(...books);

    updateBookshelf(bookshelf);

    return group;
}

function addGroupBook(name: string, book: Book) {
    const bookshelf = getBookshelf();

    if (book.group) {
        const old_group = bookshelf.find(v => v.type === 'group' && v.name === book.name) as BookShelfGroup;
        old_group.data = old_group.data.filter(v => v.id !== book.id && v.origin !== book.origin);
    }

    book.group = name;
    const new_group = bookshelf.find(v => v.type === 'group' && v.name === name) as BookShelfGroup;
    new_group.data.push(book);

    updateBookshelf(bookshelf);
}

function removeGroupBook(books: Book[]) {
    const bookshelf = getBookshelf();
    const group = bookshelf.find(v => v.type === 'group' && v.name === books[0].group) as BookShelfGroup;
   
    group.data = group.data.filter(v => !books.find(item => item.origin === v.origin && item.id === v.id));
    updateBookshelf(bookshelf);

    // NOTE 阅读历史要更新对应书籍的添加状态
    books.forEach(v => {
        const record = bookhistorys.value.find(u => u.origin === v.origin && u.id === v.id);
        if (record) {
            record.isadded = false;
        }
    })
    BookHistoryStorage.updateBookHistory(bookhistorys.value);

    return group;
}

function moveGroupBookToBookshelf(books: Book[]) {
    const bookshelf = getBookshelf();
    const group = bookshelf.find(v => v.type === 'group' && v.name === books[0].group) as BookShelfGroup;
    const movedBooks: BookShelfBook[] = books.map(v => ({ type: 'book', data: {...v, group: ''}, selected: false, pinned: false, }))

    group.data = group.data.filter(v => !books.find(item => v.id === item.id && v.origin === item.origin));
    bookshelf.push(...movedBooks);
    updateBookshelf(bookshelf);

    return group;
}

function moveBookToGroup(name: string, books: Book[]) {
    let bookshelf = getBookshelf();

    books.forEach(v => { v.group = name; v.select = false;});   // NOTE 别忘了清除分组书籍的选中状态

    const group = bookshelf.find(v => v.type === 'group' && v.name === name) as BookShelfGroup;
    if (group) {
        group.data.push(...books);
    }
    else {
        bookshelf.push({type: 'group', name: name, data: books, pinned: false, selected: false } as BookShelfGroup)
    }
    
    bookshelf = bookshelf.filter(v => !(v.type === 'book' && books.find(item => item.origin === v.data.origin && item.id === v.data.id)));
    updateBookshelf(bookshelf);

    return bookshelf;
}

function changeBookGroup(newGroup: string, books: Book[]) {
    const bookshelf = getBookshelf();
    const origins = books.map(v => v.origin);
    const ids = books.map(v => v.id);
    const oldG = bookshelf.find(v => v.type === 'group' && v.name === books[0].group) as BookShelfGroup;
    const newG = bookshelf.find(v => v.type === 'group' && v.name === newGroup) as BookShelfGroup;

    oldG.data = oldG.data.filter(v => !(origins.includes(v.origin) && ids.includes(v.id)));

    books.forEach(v => { v.group = newGroup; v.select = false });   // NOTE 别忘了清除分组书籍的选中状态
    if (!newG) {
        bookshelf.push({type: 'group', name: newGroup, data: books, selected: false, pinned: false} as BookShelfGroup)
    }
    else {
        newG.data.push(...books);
    }
    
    updateBookshelf(bookshelf);

    return oldG;
}