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

const pinia = createPinia()
pinia.use(piniaPersist)

createApp(App)
  .use(pinia)
  .use(i18n)
  .use(ElementPlus)
  .use(router)
  .use(msgBox)
  .use(message)
  .mount('#app')
