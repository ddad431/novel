// Reference
// - 自定义指令：https://cn.vuejs.org/guide/reusability/custom-directives.html
// - 自定义指令类型：https://cn.vuejs.org/guide/typescript/composition-api.html#typing-global-custom-directives
// - IntersectionObserver API: https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver#%E7%A4%BA%E4%BE%8B

import { App, Directive, DirectiveBinding } from "vue";
import defaultBookCover from '@/static/default_cover.png';

/**
 * 图片懒加载指令插件
 * 
 * 用法
 * - <view :v-bookcover-lazy="value" />
 */
const vBgImgLazy: Directive = {
    mounted: (el: HTMLElement, binding: DirectiveBinding) => {
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // 元素与视口有重叠
                if (entry.isIntersecting) { 
                    const url = binding.value;
                    el.style.backgroundImage = `url(${url}), url(${defaultBookCover})`;

                    // 元素设置完后移除监听
                    intersectionObserver.unobserve(el);
                }
            })
        })

        intersectionObserver.observe(el);
    }
}

export default vBgImgLazy;