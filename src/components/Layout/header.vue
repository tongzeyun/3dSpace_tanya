/**
 * @Author: Travis
 * @Date: 2026-02-09 14:57:17
 * @Description: 公用头部导航
 * @LastEditTime: 2026-02-09 14:57:17
 * @LastEditors: Travis
 */

<script setup lang="ts">
import { ref } from 'vue'
import imgUrl from '@/assets/imagePath';
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/userInfo'
  const router = useRouter()
  const userStore = useUserStore()
  const headerList = ref([
    {tit:'首页',path:'/',isActive:true},
    {tit:'计算',path:'/edit',isActive:false},
    {tit:'商城',path:'/shop/shop',isActive:false},
    {tit:'售后',path:'/serve',isActive:false},
    {tit:'二手商城',path:'/twohand',isActive:false},
  ])
  const userOptions = ref([
    {icon:imgUrl.header_info,tit:'个人资料',path:'/user/info'},
    {icon:imgUrl.header_address,tit:'收货地址',path:'/user/address'},
    {icon:imgUrl.header_order,tit:'我的订单',path:'/user/order'},
    {icon:imgUrl.header_integral,tit:'我的积分',path:'/user/integral'},
  ])
  const showUserList = ref(false)
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  
  // 清除隐藏定时器
  const clearHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }
  
  // 点击显示列表
  const handleClick = () => {
    if(!userStore.userInfo.username){
      router.push('/login')
      return
    }
    clearHideTimer()
    showUserList.value = true
  }
  
  // 鼠标进入：清除定时器，保持显示
  const handleMouseEnter = () => {
    clearHideTimer()
  }
  
  // 鼠标离开：延迟隐藏
  const handleMouseLeave = () => {
    hideTimer = setTimeout(() => {
      showUserList.value = false
      hideTimer = null
    }, 800)
  }
  
  const clickBtn = (item:any) => {
    router.push(item.path)
    headerList.value.forEach((ele:any) => {
      ele.isActive = false;
    })
    item.isActive = true;
  }
  const logout = () => {
    ElMessageBox({
      title: '退出提示',
      message: '确定退出登录？',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => { 
      sessionStorage.clear()
      router.push('/')
      ElMessage.success('退出成功')
    })
  }
  const changeLang = () => {
    let curLang = sessionStorage.getItem('language')
    curLang = curLang == 'zh' ? 'en' : 'zh'
    userStore.changeLang(curLang)
  }
</script>
<template>
  <div class="header_container flex-sb">
    <div class="header_l flex-sb">
      <div class="header_logo flex-fe cu" @click="router.push('/')">
        <img :src="imgUrl.header_logo" alt="">
        <span class="f24">Vacuum AI</span>
      </div>
      <div class="header_list flex-sb">
        <div 
         class="header_item base-box f16 fw-300 cu" 
         v-for="(ele,index) in headerList" 
         :key="index"
         :class="{active:ele.isActive}"
         @click="clickBtn(ele)"
         >
          {{ ele.tit }}
        </div>
      </div>
    </div>
    <div class="header_r flex-ct">
      <div class="icon cu base-box" @click="router.push('/shop/cart')">
        <img :src="imgUrl.cart">
        <div class="cart_badge f10 fw-500 flex-ct">{{ userStore.cartItems.length }}</div>
      </div>
      <div class="user_wrapper" 
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="icon user_box base-box cu" @click="handleClick">
          <img :src="imgUrl.user">
        </div>
        <transition name="fade">
          <div  class="list base-box round f16" v-show="showUserList">
            <div class="username flex-fs base-box">
              <img :src="imgUrl.header_user">
              {{ userStore.userInfo.username }}
            </div>
            <div class="list_item fw-300 cu flex-fs" 
             v-for="(ele,index) in userOptions" 
             :key="index" 
             @click="router.push(ele.path)"
             >
              <img :src="ele.icon" />
              {{ ele.tit }}
            </div>
            <div class="block"></div>
            <div class="logout flex-fs base-box round">
              <img :src="imgUrl.header_logout" />
              <div class="logout_btn fw-300 cu" @click="logout">退出登录</div>
            </div>
          </div>
        </transition>

      </div>
      <div class="icon cu">
        <img :src="imgUrl.help">
      </div>
      <div class="lange flex-sb cu round-sm base-box f14 fw-300">
        语言<img :src="imgUrl.switch">
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.header_container{
  width: 100%;
  height: 0.97rem;
  background-color: var(--text-t);
  color: white;
}
.header_l{
  margin-left: 2.37rem;
  .header_logo{
    img{
      width: 0.48rem;
      height: 0.42rem;
    }
    margin-right: 0.76rem;
    align-items: flex-end;
  }
  .header_list{
    .header_item{
      margin-right: 0.76rem;
    }
    .active::after{
      content: '';
      width: 0.32rem;
      height: 1px;
      background-color: white;
      position: absolute;
      top: -0.18rem;
      left: 50%;
      transform: translateX(-50%);
    }
  }
}
.header_r{
  margin-right: 2.37rem;
  .icon{
    margin-left: 0.42rem;
    img{
      width: 0.2rem;
      height: 0.2rem;
    }
  }
  .cart_badge{
    position: absolute;
    top: -0.06rem;
    right: -0.06rem;
    width: 0.14rem;
    height: 0.14rem;
    border-radius: 50%;
    background-color: white;
    color: var(--text-t);
  }
  .lange{
    width: 0.88rem;
    height: 0.33rem;
    color: #EAEAEA;
    border: 1px solid #EAEAEA;
    padding: 0.06rem 0.1rem;
    margin-left: 0.42rem;
    img{
      width: 0.14rem;
      height: 0.12rem;
    }
  }
}
.user_wrapper{
  position: relative;
  .list{
    position: absolute;
    top: 0.4rem;
    left: 0;
    width: 2.05rem;
    height: object-fit;
    padding: 0.08rem 0.09rem;
    z-index: 999;
    margin: 0;
    background-color: white;
    box-shadow: 0px 10px 24px 6px #3D3D5414;
    display: flex;
    flex-direction: column;
    .username{
      color: #636C6B;
      border-bottom: 1px solid rgba(159, 162, 165, 0.15);
      padding: 0.09rem 0;
      margin-bottom: 0.15rem;
      img {
        width: 0.36rem;
        height: 0.36rem;
        margin-right: 0.05rem;
      }
    }
    .list_item{ 
      width: 100%;
      color: var(--text-t);
      opacity: 0.7;
      box-sizing: border-box;
      padding: 0 0.11rem;
      margin-bottom: 0.2rem;
      img{
        margin-right: 0.15rem;
      }
    }
    .list_item:hover{
      opacity: 1;
    }
    // .list_item{ 
    //   // margin-bottom: 0;
    //   border-bottom: 1px solid rgba(159, 162, 165, 0.15);
    // }
    .logout{
      background-color: rgba(255, 119, 119, 0.15);
      margin-bottom: 0.08rem;
      color: rgba(255, 119, 119, 1);
      padding: 0.09rem 0.11rem;
      margin-top: 0.08rem;
      img{
        width: 0.14rem;
        height: 0.14rem;
        margin-right: 0.15rem;
      }
    }
    .block{
      width: 100%;
      height: 0.01rem;
      background-color: rgba(159, 162, 165, 0.15);
    }
  }
}
// 淡入淡出过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>