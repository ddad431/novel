import type { Book, BookShelfBook, BookShelf } from '@/store';
import { computed, onMounted, ref, watch } from 'vue';
import { BookShelfStore } from '@/store';
import { useBookHisotry } from './useBookhistory';
import { BookHistoryStorage } from '@/store/history';

const bookshelf = ref<BookShelf>([]);

export function useBookshelf() {
    // dependicies
    const { bookhistorys } = useBookHisotry();

    // state
    const groups = computed(() => bookshelf.value.filter(v => v.type === 'group'));
    const selectedBooks = computed(() => bookshelf.value.filter(v => v.selected));
    const seletedBookCounts = computed(() => selectedBooks.value.length);
    const isSelectAllBook = computed(() => seletedBookCounts.value === bookshelf.value.length);
    const isSelectContainGroup = computed(() => selectedBooks.value.find(v => v.type === 'group'));

    const isSelectedBookPined = computed(() => {
        if (seletedBookCounts.value !== 1) {
            return false;
        }
        return selectedBooks.value[0].pinned;
    });

    // lieftime
    onMounted(() => {
        initBookShelf();
    });

    // action
    function initBookShelf() {
        bookshelf.value = BookShelfStore.getBookshelf();
    }

    function removeBook() {
        // NOTE 书架移除书籍前，更新浏览历史对应书籍的加入状态
        const _books = selectedBooks.value.filter(v => v.type === 'book').map(v => ({id: v.data.id, origin: v.data.origin}));
        const _groups = selectedBooks.value.filter(v => v.type === 'group').map(v => v.name);
        console.log('_selcted', selectedBooks.value);
        
        console.log('_books', _books);
        
        bookhistorys.value.forEach(v => {
            if (_groups.includes(v.group) || _books.find(item => v.id === item.id && v.origin === item.origin)) {
                v.isadded = false;
            }
        })
        BookHistoryStorage.updateBookHistory(bookhistorys.value);

        BookShelfStore.removeBook(selectedBooks.value);
        bookshelf.value = BookShelfStore.getBookshelf();
    }

    function togglePinBook() {
        if (seletedBookCounts.value !== 1) {
            return;
        }

        BookShelfStore.togglePinBook(selectedBooks.value[0]);
        bookshelf.value = BookShelfStore.getBookshelf();
    }


    function clearSelectState() {
        bookshelf.value.forEach(v => v.selected = false);

        // NOTE 别忘了同步到 localstorage
        BookShelfStore.updateBookshelf(bookshelf.value);
    }

    function toggleSelectAllBook() {
        const status = !isSelectAllBook.value;
        bookshelf.value.forEach(v => v.selected = status);

        // NOTE 别忘了同步到 localstorage
        BookShelfStore.updateBookshelf(bookshelf.value);
    }

    function moveBookToGroup(name: string) {
        const books = (selectedBooks.value as BookShelfBook[]).map(v => v.data);
        const _bookshelf = BookShelfStore.moveBookToGroup(name, books);

        bookshelf.value = _bookshelf;
    }

    return {
        bookshelf,
        groups,
        removeBook,
        togglePinBook,
        seletedBookCounts,
        isSelectAllBook,
        isSelectedBookPined,
        isSelectContainGroup,
        toggleSelectAllBook,
        clearSelectState,
        moveBookToGroup,
    };
}