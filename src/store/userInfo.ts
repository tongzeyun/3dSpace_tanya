import { userApi } from '@/utils/http';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { menuData } from '@/assets/js/projectInfo';
import i18n  from '@/i18n'
export const useUserStore = defineStore('userInfo',() =>{

  const userInfo = ref<any>({})
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const menuList = ref<any[]>(menuData) // 菜单列表数据
  const getUserInfo = async () => {
    await userApi.getUserInfo().then((res:any) => {
      userInfo.value = res
    }).catch((err:any) => { console.error(err)  }) 
  }
  const changeLang = (lang: any) => {
    console.log('changeLang', lang)
    try {
      sessionStorage.setItem('language', lang)
    } catch (e) {
      console.warn('sessionStorage is not available', e)
    }
    if (i18n && i18n.global && typeof i18n.global.locale !== 'undefined') {
      i18n.global.locale.value = lang
    }
  }

  return {
    userInfo,
    refreshToken,
    token,
    menuList,
    getUserInfo,
    changeLang,
  }
},
{
  persist: {
    key: 'userInfo',
    storage: sessionStorage
  }
})