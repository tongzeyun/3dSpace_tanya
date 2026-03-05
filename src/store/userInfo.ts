import { userApi } from '@/utils/http';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { menuData } from '@/assets/js/projectInfo';
import i18n  from '@/i18n'

// 购物车商品数据接口
export interface CartItem {
  id: number
  name: string
  model: string
  pn: string
  price: number
  quantity: number
  selected: boolean
}

export const useUserStore = defineStore('userInfo',() =>{

  const userInfo = ref<any>({})
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const menuList = ref<any[]>(menuData) // 菜单列表数据
  
  // 购物车商品数据
  const cartItems = ref<CartItem[]>([
    {
      id: 1,
      name: '全量程真空计TPG2810',
      model: 'TPG2810',
      pn: 'TPG 281 A010 10B',
      price: 13900,
      quantity: 1,
      selected: false
    },
    {
      id: 2,
      name: '全量程真空计TPG2810',
      model: 'TPG2810',
      pn: 'TPG 281 A010 10B',
      price: 13900,
      quantity: 1,
      selected: false
    },
    {
      id: 3,
      name: '全量程真空计TPG2810',
      model: 'TPG2810',
      pn: 'TPG 281 A010 10B',
      price: 13900,
      quantity: 1,
      selected: false
    },
    {
      id: 4,
      name: '全量程真空计TPG2810',
      model: 'TPG2810',
      pn: 'TPG 281 A010 10B',
      price: 13900,
      quantity: 1,
      selected: false
    },
    {
      id: 5,
      name: '全量程真空计TPG2810',
      model: 'TPG2810',
      pn: 'TPG 281 A010 10B',
      price: 13900,
      quantity: 1,
      selected: false
    },
    {
      id: 6,
      name: '全量程真空计TPG2810',
      model: 'TPG2810',
      pn: 'TPG 281 A010 10B',
      price: 13900,
      quantity: 1,
      selected: false
    }
  ])

  // 全选状态
  const selectAll = computed({
    get: () => cartItems.value.length > 0 && cartItems.value.every(item => item.selected),
    set: (value: boolean) => {
      cartItems.value.forEach(item => {
        item.selected = value
      })
    }
  })

  // 计算总价
  const totalPrice = computed(() => {
    return cartItems.value
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

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

  // 购物车相关方法
  // 数量增减
  const decreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) {
      item.quantity--
    }
  }

  const increaseQuantity = (item: CartItem) => {
    item.quantity++
  }

  // 修改数量
  const changeQuantity = (item: CartItem) => {
    // 如果不是数字或者是NaN，设置为1
    if (isNaN(item.quantity) || typeof item.quantity !== 'number') {
      item.quantity = 1
      return
    }
    
    // 如果是小数，向下取整
    if (item.quantity % 1 !== 0) {
      item.quantity = Math.floor(item.quantity)
    }
    
    // 如果小于1，设置为1
    if (item.quantity < 1) {
      item.quantity = 1
    }
  }

  // 删除商品
  const deleteItem = (id: number) => {
    const index = cartItems.value.findIndex(item => item.id === id)
    if (index > -1) {
      cartItems.value.splice(index, 1)
    }
  }

  // 添加商品到购物车
  const addToCart = (item: Omit<CartItem, 'id' | 'selected' | 'quantity'>) => {
    const newItem: CartItem = {
      ...item,
      id: Date.now(), // 简单的ID生成，实际应该从后端获取
      quantity: 1,
      selected: false
    }
    cartItems.value.push(newItem)
  }

  return {
    userInfo,
    refreshToken,
    token,
    menuList,
    cartItems,
    selectAll,
    totalPrice,
    getUserInfo,
    changeLang,
    decreaseQuantity,
    increaseQuantity,
    changeQuantity,
    deleteItem,
    addToCart,
  }
},
{
  persist: {
    key: 'userInfo',
    storage: sessionStorage
  }
})