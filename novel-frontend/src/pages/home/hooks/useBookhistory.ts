import { computed, onMounted, ref } from 'vue';
import type { Book } from '@/store';
import { BookHistoryStorage } from '@/store/history';

const bookhistorys = ref<Book[]>([]);

export function useBookHisotry() {
    // state
    const selectedHistory = computed(() => bookhistorys.value.filter(v => v.select));
    const seletedHistoryCounts = computed(() => selectedHistory.value.length);
    const isSelectAllHistory = computed(() => seletedHistoryCounts.value === bookhistorys.value.length);

    // lieftime
    onMounted(() => {
        initBookHistory();
    });

    // action
    function initBookHistory() {
        bookhistorys.value = BookHistoryStorage.getBookHistory();
    }

    function removeBookHistory() {
        BookHistoryStorage.removeBookHistory(selectedHistory.value);
        bookhistorys.value = BookHistoryStorage.getBookHistory();
    }

    function clearBookHistory() {
        BookHistoryStorage.clearBookHistory();
        bookhistorys.value = [];
    }

    function clearSelectState() {
        bookhistorys.value.forEach(v => v.select = false);
    }

    function toggleSelectAllHistory() {
        if (isSelectAllHistory.value) {
            bookhistorys.value.forEach(v => v.select = false);

            return;
        }

        bookhistorys.value.forEach(v => v.select = true);
    }

    return {
        bookhistorys,
        seletedHistoryCounts,
        isSelectAllHistory,
        removeBookHistory,
        toggleSelectAllHistory,
        clearSelectState,
        clearBookHistory,
    };
}