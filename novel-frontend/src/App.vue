<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useProfileStore } from './store/profile';
 
const { initProfile } = useProfileStore();

onLaunch(() => {
    console.log('App Launch');
    initProfile();
});
onShow(() => {
    console.log('App Show');
});
onHide(() => {
    console.log('App Hide');
});
</script>

<style>
/* NOTE 在 App.vue 提前应用背景色，防止首次切换到 tab 页时出现白屏闪烁 (原因参见：https://en.uniapp.dcloud.io/tutorial/performance.html#%E4%BC%98%E5%8C%96%E8%83%8C%E6%99%AF%E8%89%B2%E9%97%AA%E7%99%BD) */
body {
    background-color: #fff;
}

body.dark-mode {
    background-color: #121212;
}
</style>