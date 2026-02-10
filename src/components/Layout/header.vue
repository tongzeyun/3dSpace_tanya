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
  const router = useRouter()
  const headerList = ref([
    {tit:'首页',path:'/home',isActive:true},
    {tit:'计算',path:'/edit',isActive:false},
    {tit:'商城',path:'/shop',isActive:false},
    {tit:'售后',path:'/serve',isActive:false},
    {tit:'二手商城',path:'/twohand',isActive:false},
  ])
  const clickBtn = (item:any) => {
    router.push(item.path)
    headerList.value.forEach((ele:any) => {
      ele.isActive = false;
    })
    item.isActive = true;
  }
</script>
<template>
  <div class="header_container flex-sb">
    <div class="header_l flex-sb">
      <div class="header_logo flex-fe">
        <img :src="imgUrl.header_logo" alt="">
        <span class="f24">Vacuum AI</span>
      </div>
      <div class="header_list flex-sb">
        <div 
         class="header_item base-box f16 fw-300 cu" 
         v-for="ele in headerList" 
         :class="{active:ele.isActive}"
         @click="clickBtn(ele)"
         >
          {{ ele.tit }}
        </div>
      </div>
    </div>
    <div class="header_r flex-ct">
      <div class="cu">
        <img :src="imgUrl.car">
      </div>
      <div class="cu">
        <img :src="imgUrl.user">
      </div>
      <div class="cu">
        <img :src="imgUrl.help">
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
  div{
    margin-left: 0.42rem;
    img{
      width: 0.2rem;
      height: 0.2rem;
    }
  }
}
</style>