import { Book } from "./bookshelf";

type BookHistory = Book[];

export const BookHistoryStorage = {
    getBookHistory,
    addBookHistory,
    removeBookHistory,
    clearBookHistory,
    updateBookHistory,
};

function getBookHistory(): BookHistory {
    return JSON.parse(uni.getStorageSync('bookhistory') || '[]');
}

function updateBookHistory(history: Book[]) {
    uni.setStorageSync('bookhistory', JSON.stringify(history));
}

function addBookHistory(book: Book) {
    book.visit = Date.now();

    let historys = getBookHistory();
    const record = historys.find(v => v.origin === book.origin && v.id === book.id);

    if (record) {
        record.isadded = true;
    }
    else {
        historys.unshift(book);
    }

    updateBookHistory(historys);
}

function removeBookHistory(books: Book[]) {
    const historys = getBookHistory();
    const origins = books.map(v => v.origin);
    const ids = books.map(v => v.id);
    const newHistorys = historys.filter(v => !(origins.includes(v.origin) && ids.includes(v.id)));

    updateBookHistory(newHistorys);
}

function clearBookHistory() {
    const historys = [] as Book[];
    updateBookHistory(historys);
}