import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from '@/i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
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
if (sessionStorage.getItem('token')) {
  modelStore.loadModelList()
}

app.mount('#app')
