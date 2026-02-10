<script setup lang="ts">
  // import Home from './views/Home.vue';
import { useModelStore } from '@/store/model';
import ImportPump from '@/views/ImportPump.vue';
import Layer from '@/components/Layout/markLayer.vue';
// import Header from '@/components/Layout/header.vue';
// import Footer from '@/components/Layout/footer.vue'
  const modelStore = useModelStore();
</script>

<template>
  <router-view></router-view>
  <!-- <div class="main_container">
    <div class="main_header">
      <Header></Header>
    </div>
    <div class="main_box">
      <router-view></router-view>
    </div>
    <div class="main_footer">
      <Footer></Footer>
    </div>
  </div> -->
  
  <Layer append-to-body v-model="modelStore.importVisiable" width="16rem">
    <ImportPump></ImportPump>
  </Layer>
  <!-- <Home></Home> -->
</template>

<style scoped lang="scss">

</style>
