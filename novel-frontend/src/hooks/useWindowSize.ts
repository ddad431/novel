import { onMounted, onUnmounted, ref } from "vue";

export function useWindowSize() {
    const vwidth = ref(window.innerWidth);
    const vheight = ref(window.innerHeight);

    function handleWindowSizeUpdate() {
        vwidth.value = window.innerWidth;
        vheight.value = window.innerHeight;
    }

    onMounted(() => {
        window.addEventListener('resize', handleWindowSizeUpdate)
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleWindowSizeUpdate);
    })

    return {
        vwidth,
        vheight,
    }
}