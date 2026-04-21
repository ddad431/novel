import { createSSRApp } from 'vue';

import App from '@/App.vue';

import 'virtual:uno.css';
import '@/styles/index.css';
import i18n from '@/i18n';
import directives from './directives';

export function createApp() {
    const app = createSSRApp(App);

    app.use(i18n);
    app.use(directives);

    return {
        app,
    };
}