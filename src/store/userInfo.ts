import { userApi } from '@/utils/http';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('userInfo',() =>{

  const userInfo = ref<any>({})
  const token = ref<string>('')
  const refreshToken = ref<string>('')

  const getUserInfo = async () => {
    await userApi.getUserInfo().then((res:any) => {
      userInfo.value = res
    }).catch((err:any) => { console.error(err)  }) 
  }

  return {
    userInfo,
    refreshToken,
    token,
    getUserInfo
  }
},
{
  persist: {
    key: 'userInfo',
    storage: sessionStorage
  }
})