<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import i18n from '@/i18n'
import { ref , onMounted , getCurrentInstance } from 'vue'
import imgUrl from '@/assets/imagePath'
import { useModelStore } from '@/store/model'
  const { t } = useI18n()
  const router = useRouter()
  const { proxy } = getCurrentInstance() as any
  const modelStore = useModelStore()
  onMounted(() => {
    console.log(i18n)
  })

  const asideData = ref([
    {icon: imgUrl.left_icon_1,sort:0 ,title: '新建项目', path:'/edit', sub:[]},
    {icon: imgUrl.left_icon_2,sort:1 ,title: '已保存项目', path:'/project', sub:[]},
    {icon: imgUrl.left_icon_3,sort:2 ,title: '元件自定义', path:'', sub:[]},
    {icon: imgUrl.left_icon_4,sort:3 ,title: '元件管理', path:'/element', sub:[]},
    {icon: imgUrl.left_icon_5,sort:4 ,title: '模型格式转换', path:'/conversion', sub:[]},
  ])

  // const changeLang = (lang: any) => {
  //   try {
  //     sessionStorage.setItem('language', lang)
  //   } catch (e) {
  //     console.warn('sessionStorage is not available', e)
  //   }
  //   if (i18n && i18n.global && typeof i18n.global.locale !== 'undefined') {
       
  //     i18n.global.locale.value = lang
  //   }
  // }
  const clickMenu = (data: any) => {
    router.push(data.path)
    if(data.sort == 2){
      modelStore.importVisiable = true
    }
  }
  const logout = () => {
    proxy?.$msgBox.messageBox({
      title:'退出提示',
      text:'确定退出登录？',
    },(action:string) => {
      if(action == 'confirm'){
        sessionStorage.clear()
        router.push('/login')
        proxy?.$message.show('退出成功','success')
      }
    })
    // console.log('logout');
  }
</script>
<template>
  <div class="header_box base-box bg-box">
    <img class="bg_icon" :src="imgUrl.left_icon_6" >
    <div class="header_top flex-fs">
      <img :src="imgUrl.logo" />
      <div class="tit f24">Vacuum AI</div>
    </div>
    <div class="menu_list base-box">
      <div v-for="(item,index) in asideData" :key="index" @click="clickMenu(item)" class="menu_item cu base-box text-l flex-fs">
        <img class="icon" :src="item.icon"/>
        <div class="tit f18">{{ item.title }}</div>
      </div>
    </div>
    <div class="header_btm base-box">
      <div class="logout f18 cu flex-fs" @click="logout">
        <img :src="imgUrl.logout">
        {{ t('msg.editor.logout') }}
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.header_box{
  width: 2.87rem;
  height: 100%;
  padding: 0.44rem 0.22rem 0 0.4rem;
  // background-image: url('/public/img/edit_left_bg.png');
  background-color: rgba(238, 245, 251, 0.45);
  box-shadow: 2px 0px 18px 0px rgba(105, 109, 114, 0.08);
  .bg_icon{
    width: 1.2rem;
    height: 1.2rem;
    position: absolute;
    right: 0.22rem;
    bottom: 1.47rem;
  }
}
.header_top{
  width: 2.5rem;
  height: 0.4rem;
  // height: fit-content;
  margin-bottom: 0.3rem;
  img{
    width: 0.45rem;
    height: 0.4rem;
    margin-right: 0.2rem;
  }
  .tit{
    font-weight: 700;
  }
}
.menu_list{
  width: 2.25rem;
  height: 8.45rem;
  border-top: 1px solid rgba(99, 108, 107, 0.25);
  border-bottom: 1px solid rgba(99, 108, 107, 0.25);
  padding: 0.55rem 0 0 0;
  .menu_item{
    color: var(--text-p);
    width: 100%;
    padding-left: 0.27rem;
    margin-bottom: 0.8rem;
    .icon{
      width: 0.22rem;
      height: 0.23rem;
      margin-right: 0.25rem;
    }
  }
}
.header_btm{
  padding-left: 0.27rem;
  .logout{
    margin-top: 0.35rem;
    color: var(--text-p);
    img{
      width: 0.22rem;
      height: 0.22rem;
      margin-right: 0.25rem;
    }
  }
}
</style>