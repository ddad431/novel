// Reference
// - 自定义插件：https://cn.vuejs.org/guide/reusability/plugins.html

import { App, Directive } from "vue";
import vBgImgLazy from "./img-lazy";

const directives: Record<string, Directive> = {
    'bg-img-lazy': vBgImgLazy,
};

export default {
    install: (app: App) => {
        Object.keys(directives).forEach((key) => {
            app.directive(key, directives[key]);
        })
    }
}