import { createPinia } from 'pinia';
// import { createPersistedState } from 'pinia-plugin-persistedstate';

const pinia = createPinia();

// https://github.com/Allen-1998/pinia-plugin-persist-uni/issues/21#issue-3022160875
// pinia.use(
//     createPersistedState({
//         storage: {
//             getItem: uni.getStorageSync,
//             setItem: uni.setStorageSync,
//         }
//     })
// );

export default pinia;