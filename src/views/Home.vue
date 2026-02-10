<script lang="ts" setup>
import { useRouter } from 'vue-router';
import imgUrl from '@/assets/imagePath';
import Footer from '@/components/Layout/footer.vue'
import Header from '@/components/Layout/header.vue'
// import { useI18n } from 'vue-i18n'

  // const { t } = useI18n()
  const router = useRouter()

  const goEditor = () => {
    router.push('/edit')
  }
</script>
<template>
  <div class="home_container base-box scrollbar">
    <div class="header_box">
      <Header></Header>
    </div>
    <div class="page_1 base-box">
      <!-- <img class="home_bg" :src="imgUrl.home_bg_1">
      <img class="home_bg" :src="imgUrl.home_bg_2"> -->
      
      <div class="home_tit f64">
        Vacuum AI
        <span class="f16 fw-300">(Alpha)</span>
      </div>
      <div class="home_txt f18 fw-300">
        {{ $t('msg.home.title') }}
      </div>
      <div class="home_btn flex-ct f20 base-box" @click="goEditor">
        {{ $t('msg.home.free') }}
        <img :src="imgUrl.home_btn">
      </div>
    </div>
    <div class="footer_box">
      <Footer></Footer>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.home_container{
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
}
.page_1{
  height: 8rem;
  padding-left: 2.37rem;
  padding-top: 2.22rem;
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
.footer_box{
  width: 100%;
  height: fit-content;
}
</style>