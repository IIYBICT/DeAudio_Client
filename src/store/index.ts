import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 创建Pinia
const store = createPinia()
// 引入Pinia持久化插件
store.use(piniaPluginPersistedstate)
export default store
