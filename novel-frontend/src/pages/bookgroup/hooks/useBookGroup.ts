import { useBookshelf } from "@/pages/home/hooks";
import { BookShelfGroup, BookShelfStore } from "@/store";
import { computed, ref } from "vue";

export function useBookGroup() {
    // dependicies
    const { bookshelf, groups } = useBookshelf();

    // states
    const bookgroup = ref<BookShelfGroup>();
    const books = computed(() => bookgroup.value!.data);
    const selectedGroupBooks = computed(() => books.value.filter(v => v.select));
    const selectedGroupBookCounts = computed(() => selectedGroupBooks.value?.length);
    const isSelectedGropAllBooks = computed(() => selectedGroupBookCounts.value === bookgroup.value?.data.length);

    // lifetime

    // actions
    function initGroup(group: BookShelfGroup) {
        bookgroup.value = group;
    }
  
    function renameGroup(name: string) {
        BookShelfStore.renameGroup(bookgroup.value!.name, name);

        bookgroup.value!.name = name;
        bookshelf.value = BookShelfStore.getBookshelf();
    }

    function cleanGroup() {
        bookgroup.value = BookShelfStore.cleanGroup(bookgroup.value!.name);
        removeGroup();
    }

    function removeGroup() {
        BookShelfStore.removeGroup(bookgroup.value!.name);

        bookshelf.value = BookShelfStore.getBookshelf();
        navToHome();
    }

    function removeGroupBook() {
        bookgroup.value = BookShelfStore.removeGroupBook(selectedGroupBooks.value);
        bookshelf.value = BookShelfStore.getBookshelf();

        if (books.value.length === 0) {
            removeGroup();
        }
    }

    function moveGroupBookToBookshelf() {
        bookgroup.value = BookShelfStore.moveGroupBookToBookshelf(selectedGroupBooks.value);
        bookshelf.value = BookShelfStore.getBookshelf();

        if (books.value.length === 0) {
            removeGroup();
        }
    }

    function changeBookGroup(newGroup: string) {
        bookgroup.value = BookShelfStore.changeBookGroup(newGroup, selectedGroupBooks.value);
        bookshelf.value = BookShelfStore.getBookshelf();

        if (books.value.length === 0) {
            removeGroup();
        }
    }

    function toggleSelectGroupAllBook() {
        const newSelectStatus = !isSelectedGropAllBooks.value;
        bookgroup.value?.data.forEach(v => v.select = newSelectStatus);
    }

    function clearGroupBookSelectStates() {
        bookgroup.value?.data.forEach(v => v.select = false);
    }

    function navToHome() {
        if (!document.startViewTransition) {
            uni.switchTab({ url: '/pages/home/home' });
            return;
        }

        document.documentElement.classList.add('is-back2');
        const transition = document.startViewTransition(() => {
            uni.switchTab({ url: '/pages/home/home' });
        });

        transition.finished.finally(() => {
            document.documentElement.classList.remove('is-back2');
        });
    }

    return {
        bookgroup,
        groups,
        selectedGroupBookCounts,
        isSelectedGropAllBooks,
        initGroup,
        renameGroup,
        removeGroup,
        cleanGroup,
        removeGroupBook,
        moveGroupBookToBookshelf,
        changeBookGroup,
        toggleSelectGroupAllBook,
        clearGroupBookSelectStates,
    }
}