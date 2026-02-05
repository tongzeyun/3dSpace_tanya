<script lang="ts" setup>
import { useRouter } from 'vue-router';
import imgUrl from '@/assets/imagePath';
// import { useI18n } from 'vue-i18n'

  // const { t } = useI18n()
  const router = useRouter()

  const goEditor = () => {
    router.push('/edit')
  }
</script>
<template>
  <div class="home_container base-box">
    <img class="home_bg" :src="imgUrl.home_bg_1">
    <img class="home_bg" :src="imgUrl.home_bg_2">
    
    <div class="home_tit f74">
      Vacuum AI
      <span class="f16 fw-300">(Alpha)</span>
    </div>
    <div class="home_txt f26">
      <!-- 让自定义真空组件像拖放一样简单的专业设计软件，简化每一步 -->
      <!-- 让真空系统设计变得更简单 -->
      {{ $t('msg.home.title') }}
    </div>
    <div class="home_btn flex-ct f20 base-box" @click="goEditor">
      {{ $t('msg.home.free') }}
      <img :src="imgUrl.home_btn">
    </div>
  </div>
  
</template>
<style lang="scss" scoped>
.home_container{
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
  padding-left: 0.93rem;
  padding-top: 4.2rem;
  .home_bg{
    position: absolute;
  }
  .home_bg:nth-of-type(1){
    width: 5.28rem;
    height: 4.22rem;
    top: 0.4rem;
    left: 4.3rem;
  }
  .home_bg:nth-of-type(2){
    width: 9.62rem;
    height: 9.4rem;
    top: 1.4rem;
    right: 0rem;
  }
  .home_tit{
    height: 0.9rem;
    line-height: 0.9rem;
    color: var(--text-t);
    font-weight: 500;
    span{
      margin-left: -0.1rem;
      color: var(--text-p);
    }
    // margin-top: 4.2rem;
  }
  .home_txt{
    height: 0.4rem;
    line-height: 0.4rem;
    margin-top: 0.1rem;
    color: var(--text-p);
    font-weight: 500;
  }
  .home_btn{
    width: 1.6rem;
    height: 0.5rem;
    margin-top: 0.47rem;
    color: white;
    background-color: var(--theme);
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    
    img{
      margin-left: 0.07rem;
      width: 0.18rem;
      height: 0.06rem;
    }
  }
}
</style>