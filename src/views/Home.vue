<script lang="ts" setup>
import { useRouter } from 'vue-router';
// import { useI18n } from 'vue-i18n'

  // const { t } = useI18n()
  const router = useRouter()
</script>
<template>
  <div class="home_container base-box">
    <div class="header">

      <el-button type="primary" @click="router.push('/edit')">go Editor</el-button>
      <el-button type="primary" @click="router.push('/conversion')">go Conversion</el-button>
    </div>
  </div>
  
</template>
<style lang="scss" scoped>
.home_container{
  width: 100%;
  height: 100%;
  padding: 1rem;
}
.btn{
  width: fit-content;
  padding: 0.5rem;
  cursor: pointer;
  user-select: none;
  border: 1px solid #aaaaaa;
  margin-top: 0.3rem;
}
</style>