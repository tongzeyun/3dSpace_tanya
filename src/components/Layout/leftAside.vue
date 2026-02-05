<script lang="ts" setup>
// import { useI18n } from 'vue-i18n'
import { useRouter , useRoute} from 'vue-router'
// import i18n from '@/i18n'
import { ref , onMounted , computed} from 'vue'
import imgUrl from '@/assets/imagePath'
import { useModelStore } from '@/store/model'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/userInfo'
  // const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const modelStore = useModelStore()
  const userStore = useUserStore()
  onMounted(() => {
    // console.log(i18n)
  })

  let curRoute = computed(() => {
    // console.log(route.path)
    return route.path
  })

  const asideData = ref([
    {icon: imgUrl.left_icon_1,sort:0 ,titleKey: 'msg.aside.newProject', path:'/edit', sub:[]},
    {icon: imgUrl.left_icon_2,sort:1 ,titleKey: 'msg.aside.savedProjects', path:'/project', sub:[]},
    {icon: imgUrl.left_icon_3,sort:2 ,titleKey: 'msg.aside.customComponent', path:'', sub:[]},
    {icon: imgUrl.left_icon_4,sort:3 ,titleKey: 'msg.aside.elementManage', path:'/element', sub:[]},
    {icon: imgUrl.left_icon_5,sort:4 ,titleKey: 'msg.aside.formatConversion', path:'/conversion', sub:[]},
  ])

  const clickMenu = (data: any) => {
    router.push(data.path)
    if(data.sort == 2){
      modelStore.importVisiable = true
    }
  }
  const logout = () => {
    ElMessageBox({
      title: '退出提示',
      message: '确定退出登录？',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => { 
      sessionStorage.clear()
        router.push('/')
        ElMessage.success('退出成功')
    })
  }
  const changeLang = () => {
    let curLang = sessionStorage.getItem('language')
    curLang = curLang == 'zh' ? 'en' : 'zh'
    userStore.changeLang(curLang)
  }
</script>
<template>
  <div class="header_box base-box bg-box">
    <img class="bg_icon" :src="imgUrl.left_icon_6" />
    <div class="r_aside_top flex-fe">
      <div class="f12 flex-ct cu">
        <img :src="imgUrl.helper" />
        {{ $t('msg.aside.help') }}
      </div>
      <div class="f12 flex-ct cu" @click="changeLang">
        <img :src="imgUrl.lang" />
        {{ $t('msg.aside.lange') }}
      </div>
    </div>
    <div class="header_top flex-fs">
      <img :src="imgUrl.logo" />
      <div class="tit f24">Vacuum AI</div>
    </div>
    <div class="menu_list base-box">
      <div class="menu_item cu base-box text-l flex-fs round"
       v-for="(item,index) in asideData" 
       :key="index"
       @click="clickMenu(item)" 
       :class="{isActive:item.path == curRoute }">
        <img class="icon" :src="item.icon"/>
          <div class="tit f18">{{ $t(item.titleKey) }}</div>
      </div>
    </div>
    <div class="header_btm base-box">
      <div class="logout f18 cu flex-fs" @click="logout">
        <img :src="imgUrl.logout">
        {{ $t('msg.editor.logout') }}
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
.r_aside_top{
  color: var(--text-d);
  margin-bottom: 0.1rem;
  div{
    margin-left: 0.22rem;
    img{
      margin-right: 0.07rem;
    }
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
    height: 0.47rem;
    padding-left: 0.27rem;
    margin-bottom: 0.8rem;
    .icon{
      width: 0.22rem;
      height: 0.23rem;
      margin-right: 0.25rem;
    }
  }
  .isActive{
    background-color: rgba(91, 155, 255, 0.2);
    color: #5C9BFF;
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