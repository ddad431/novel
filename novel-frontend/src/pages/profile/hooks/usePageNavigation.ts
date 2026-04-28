import { ref } from "vue";

export type SubPage = '语言' | '外观' | '书源';

export function usePageNavigation() {
    const curSubPage = ref<SubPage>('书源');
    const mainPageOffset = ref<string>('0');
    const subPageOffset = ref<string>('100vw');

    function handleNavToSubPage(page: SubPage) {
        curSubPage.value = page;

        mainPageOffset.value = '-100vw';
        subPageOffset.value = '0vw';
    }

    function handleBackToMainPage() {
        subPageOffset.value = '100vw',
        mainPageOffset.value = '0vw';
    }

    return {
        curSubPage,
        mainPageOffset,
        subPageOffset,
        handleNavToSubPage,
        handleBackToMainPage,
    }
}