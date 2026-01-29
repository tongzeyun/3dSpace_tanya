<script setup lang="ts">
  // import Home from './views/Home.vue';
import { useModelStore } from '@/store/model';
import ImportPump from '@/views/ImportPump.vue';
import Layer from '@/components/Layout/markLayer.vue';
  const modelStore = useModelStore();
</script>

<template>
  <router-view></router-view>
  <Layer append-to-body v-model="modelStore.importVisiable" width="16rem">
    <ImportPump></ImportPump>
  </Layer>
  <!-- <Home></Home> -->
</template>

<style scoped lang="scss">

</style>
