<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const router = useRouter()

  const goEditor = () => {
    router.push('/edit')
  }
</script>
<template>
  <div class="home_container base-box">
    <div class="title f30">{{ t('msg.home.title') }}</div>
    <div class="btn f24 base-box round show-box" @click="goEditor">go Editor</div>
  </div>
</template>
<style lang="scss" scoped>
.home_container{
  width: 100%;
  height: 100%;
  padding: 1rem;
}
.btn{
  padding: 0.5rem;
  display: inline-block;
  cursor: pointer;
  user-select: none;
  border: 1px solid #aaaaaa;
}
</style>