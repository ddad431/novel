import { createSSRApp } from 'vue';

import App from '@/App.vue';
import pinia from '@/stores';

import 'virtual:uno.css';
import '@/styles/index.css';
import i18n from '@/i18n';

export function createApp() {
    const app = createSSRApp(App);

    app.use(pinia);
    app.use(i18n);

    return {
        app,
    };
}