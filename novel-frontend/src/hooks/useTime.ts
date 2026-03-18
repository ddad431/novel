import { getCurTime } from "@/utils";
import { onMounted, onUnmounted, ref } from "vue";

export function useTime() {
    const curTime = ref<string>('');
    let timerId: number | null = null;

    function updateTime() {
       curTime.value = getCurTime();
    }

    onMounted(() => {
        updateTime();

        timerId = setInterval(updateTime, 1000);
    });

    onUnmounted(() => {
        if (timerId !== null) {
            clearInterval(timerId);
        }
    });

    return {
        curTime,
    }
}