import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from '@/i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import msgBox from './components/Layout/msgBox/index.ts'
import message from './components/Layout/message/index.ts'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import { useModelStore } from './store/model'

const pinia = createPinia()
pinia.use(piniaPersist)

const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.use(ElementPlus)
app.use(router)
app.use(msgBox)
app.use(message)

// 应用启动时，如果已登录则预加载公用模型列表
const modelStore = useModelStore(pinia)

async function initApp() {
  if (sessionStorage.getItem('token')) {
    modelStore.clearLists()
    try {
      // 并发加载三类模型，全部完成后再继续（提高启动速度）
      await Promise.all([
        modelStore.loadPublicModelList(),
        modelStore.loadValveList(),
        modelStore.loadUserModelList(),
      ])
    } catch (e) {
      // 加载失败不阻止应用启动，但在控制台记录错误
      console.error('预加载模型列表出错：', e)
    }
  }

  
}

initApp()
// 所有准备工作完成后再挂载应用，保证后续页面能使用已加载的数据
app.mount('#app')
