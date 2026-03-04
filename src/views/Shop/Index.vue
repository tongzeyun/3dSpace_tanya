/**
 * @Author: Travis
 * @Date: 2026-03-03 09:44:10
 * @Description: 商城主页面
 * @LastEditTime: 2026-03-03 09:44:10
 * @LastEditors: Travis
 */

<script setup lang="ts">
// import { ref } from 'vue'
import Header from '@/components/Layout/header.vue'
import Footer from '@/components/Layout/footer.vue'
</script>
<template>
  <div class="shop_container base-box scrollbar">
    <div class="header_box">
      <Header></Header>
    </div>
    <div class="show_box">
      <router-view></router-view>
    </div>
    <div class="footer_box">
      <Footer></Footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shop_container{
  width: 100%;
  height: 100%;
}
</style>