<template>
    <view
        class="w-full box-border p-[4px_8px] rounded-[8px] flex"
        :style="`height: ${props.height ?? '32px'}; background: ${props.bg}`"
    >
        <template v-for="(item, index) in props.options" :key="index">
            <view
                class="flex-1 flex justify-center items-center"
                :style="`${item === value ? `background: ${props.activeBg}; border-radius: 8px;` : ''}`"
                @click="onSelect(item)"
            >
                {{ item }}
            </view>
        </template>
    </view>
</template>

<script setup lang="ts">
const props = defineProps<{
    options: any[],
    height?: string,
    bg?: string,
    activeBg?: string,
}>();

const value = defineModel<string>();
const emit = defineEmits<{
    change: [select: string],
}>()

function onSelect(select: string) {
    value.value = select;
    emit('change', select);
}
</script>