import { defineConfig } from 'vite';

import Uni from '@dcloudio/vite-plugin-uni';
import Unocss from 'unocss/vite';

import UniCom from '@uni-helper/vite-plugin-uni-components';
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        UniCom({ resolvers: [WotResolver()] }),
        Uni.default(),
        Unocss(),
    ],
    define: {
        'import.meta.env.VERSION': JSON.stringify(process.env.npm_package_version),
    },
});
