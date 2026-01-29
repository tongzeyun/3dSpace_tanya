import { userApi } from '@/utils/http';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { menuData } from '@/assets/js/projectInfo';
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

  return {
    userInfo,
    refreshToken,
    token,
    menuList,
    getUserInfo,
  }
},
{
  persist: {
    key: 'userInfo',
    storage: sessionStorage
  }
})