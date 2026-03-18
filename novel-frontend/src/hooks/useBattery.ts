import { computed, ref } from "vue";

interface BatteryInfo {
    /** 电量 */
    level: number,

    /** 充电状态 */
    isCharging: boolean,
}

export function useBattery() {
    const batteryInfo = ref<BatteryInfo>({
        level: 100,
        isCharging:false,
    });

    const batteryStyle = computed(() => {
        if (batteryInfo.value.level < 15) {
            return 'battery-1';
        }
        else if (batteryInfo.value.level >= 12.5 && batteryInfo.value.level < 30) {
            return 'battery-2';
        }
        else if (batteryInfo.value.level >= 25 && batteryInfo.value.level < 45) {
            return 'battery-3';
        }
        else if (batteryInfo.value.level >= 12.5 && batteryInfo.value.level < 60) {
            return 'battery-4';
        }
        else if (batteryInfo.value.level >= 12.5 && batteryInfo.value.level < 75) {
            return 'battery-5';
        }
        else if (batteryInfo.value.level >= 12.5 && batteryInfo.value.level < 90) {
            return 'battery-6';
        }
        else if ((batteryInfo.value.level >= 12.5 && batteryInfo.value.level <= 100)) {
            return 'battery-7';
        }
    });

    // TODO firefox 不支持该 API，还有当前的实现只是 H5 的
    navigator.getBattery().then((battery: any) => {
        batteryInfo.value.level = battery.level * 100;
        batteryInfo.value.isCharging = battery.charging;

        battery.addEventListener("levelchange", () => {
            batteryInfo.value.level = battery.level * 100;
        });

        battery.addEventListener("chargingchange", () => {
            batteryInfo.value.isCharging = battery.charging;
        });
    });

    return {
        batteryInfo,
        batteryStyle,
    }
}