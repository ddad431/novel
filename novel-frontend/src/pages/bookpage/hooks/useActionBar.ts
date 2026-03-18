import { ref } from "vue";

export function useActionBar() {
    // states
    const actionBarVisible = ref<boolean>(false);

    // actions
    function toggleActionBar() {
        actionBarVisible.value = !actionBarVisible.value;
    }

    return {
        actionBarVisible,
        toggleActionBar,
    }
}