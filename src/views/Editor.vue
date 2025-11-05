<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import Header from '@/components/Editor/editorHeader.vue';
</script>
<template>
  <div class="edit_container">
    <div class="edit_header">
      <Header></Header>
    </div>
    <div class="cvs_box">
      <MyCanvas></MyCanvas>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.edit_container{
  width: 100vw;
  height: 100vh;
}
</style>
