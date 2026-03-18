import { createI18n } from "vue-i18n";
import enUS from './locales/en-US.json';
import zhCN from './locales/zh-CN.json';

const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'zh',
    messages: {
        zh: zhCN,
        en: enUS,
    },
    missingWarn: false,
    fallbackWarn: false,
    missing: (locale, key) => {
        // 当没有注册这个字段名（即回退时也没有找到），那么就是用这个直接字段名，不要添加 'profile.' 前缀
        if (key.startsWith('profile.')) {
            return key.replace('profile.', '');
        }
        return key;
    }
});

export default i18n;