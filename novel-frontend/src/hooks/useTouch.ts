import { ref } from 'vue';

export function useTouch() {
    const startX = ref<number>(0);
    const offsetX = ref<number>(0);

    function touchStart(event: any) {
        const touch = event.touches[0];

        startX.value = touch.clientX;
    }

    function touchMove(event: any) {
        const touch = event.touches[0];

        offsetX.value = Math.abs(touch.clientX - startX.value);
    }

    return {
        touchStart,
        touchMove,
        startX,
        offsetX,
    };
}