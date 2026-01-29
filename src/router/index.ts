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
    },
    {
      path:'/conversion',
      name:'Conversion',
      component: () => import('@/views/Conversion.vue'),
    },
    {
      path:'/login',
      name:'Login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path:'/register',
      name:'Register',
      component: () => import('@/views/Regist.vue'),
    },
    {
      path:'/project',
      name:'Project',
      component: () => import('@/views/Project.vue'),
    },
    {
      path:'/importpump',
      name:'ImportPump',
      component: () => import('@/views/ImportPump.vue'),
    },
    {
      path:'/element',
      name:'Element',
      component: () => import('@/views/Element.vue'),
    }
  ]
})
router.beforeEach((to, _from, next) => {
	if (!sessionStorage.getItem('token')) { // 如果没有
		if (to.name == "Login" || to.name == "Register") { //判断是否要去登陆界面如果是则放行
      next()
		}else { // 否则直接跳转登录界面
			router.push('/login')
		}
	} else { // 如果有则放行
    next()
  }
})
export default router