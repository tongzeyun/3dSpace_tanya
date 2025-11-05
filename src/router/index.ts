import {createRouter,createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Editor from '@/views/Editor.vue'
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes:[
    {
      path:'/',
      name:'Home',
      component:Home,

    },
    {
      path:'/edit',
      name:'Edit',
      component: Editor,
    }
  ]
})

export default router