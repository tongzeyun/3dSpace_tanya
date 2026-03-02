/**
 * @Author: Travis
 * @Date: 2026-01-08 10:11:40
 * @Description: 用户项目管理页面
 * @LastEditTime: 2026-01-08 10:11:40
 * @LastEditors: Travis
 */
<script setup lang="ts">
import { pocApi } from '@/utils/http';
import { ref , onMounted } from 'vue'
import { useRouter } from 'vue-router';
import Pagination from '@/components/Layout/pagination.vue'
import { useProjectStore } from '@/store/project';
import { ElMessage, ElMessageBox } from 'element-plus';
import LeftAside from '@/components/Layout/leftAside.vue';
import dayjs from 'dayjs';
import imgUrl from '@/assets/imagePath';
// import { gasTypeOptions } from '@/assets/js/projectInfo';
// import { useI18n } from 'vue-i18n'

  // const { t } = useI18n()
  const router = useRouter()
  // const userStore = useUserStore()
  const projectStore = useProjectStore()
  // const addPopVisable = ref<boolean>(false)
  const pocList = ref<any[]>([])
  const currentPage = ref<number>(1)
  const pocCount = ref<number>(0)
  const searchVal = ref<string>('')
  // const pocForm = reactive<any>({
  //   name:''
  // })
  onMounted( async () => {
    await getPocListFun()
  })

  const getPocListFun = async () => {
    await pocApi.getPocList({
      page: currentPage.value,
      pageSize: 12,
      search: searchVal.value
    }).then((res:any) => {
      pocList.value = res.results
      pocCount.value = res.count
      console.log('res',res)
    }).catch(err => {
      console.error('err',err)
    })
  }

  // const createPoc = () => {
  //   pocApi.createPoc({
  //     user:userStore.userInfo.id,
  //     project_name: pocForm.name,
  //     model_data:[],
  //   }).then((res:any) => {
  //     // console.log('res',res)
  //     getPocListFun()
  //     // projectStore.setProjectInfo(res)
  //     projectStore.projectInfo.name = res.name
  //     projectStore.projectInfo.id = res.id
  //     addPopVisable.value = false
  //     clearForm()
  //     ElMessage({
  //       type: 'success',
  //       message: '创建成功!',
  //     })
  //   })
  // }
  const handleCurrentChange = () => {
    getPocListFun()
  }
  const editPoc = (item:any) => {
    // console.log('item',item)
    projectStore.setProjectInfo(item)
    console.log('projectInfo===>',projectStore.projectInfo)
    router.push('/edit')
  }
  const delPoc = (id:number) => {
    ElMessageBox.confirm('此操作将永久删除该文件, 是否继续?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      pocApi.delPocById(id).then(_res => {
        // console.log('res',res)
        ElMessage({
          type: 'success',
          message: '删除成功!',
        })
        getPocListFun()
      }).catch(err => {
        console.error('err',err)
      })
    }).catch(() => {
      
    })
  }
  // const clearForm = () => {
  //   pocForm.name = ''
  // }
</script>
<template>
  <div class="poc_container base-box flex-fs">
    <div class="poc_left">
      <LeftAside></LeftAside>
    </div>
    <div class="poc_box base-box">
      <div class="poc_tit f32 fw-700">{{ $t('msg.page.myPoc') }}</div>
      <div class="poc_search base-box">
        <input v-model="searchVal" placeholder="请输入项目名称" @blur="getPocListFun">
        <img :src="imgUrl.search">
      </div>
      <div class="poc_list flex-fs">
        <div class="poc_item base-box round-sm" v-for="item in pocList" :key="item.id">
          <div class="time flex-fs f14 fw-300">
            <img :src="imgUrl.poc_time">
            {{ dayjs(item.updated_at).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
          <div class="name f20 fw-700">{{ item.project_name }}</div>
          <div class="btn_box flex-sb">
            <div class="btn cu round-sm base-box f14 flex-ct" @click="editPoc(item)">进入项目</div>
            <img class="cu" :src="imgUrl.poc_del" @click="delPoc(item.id)">
            <!-- <el-button type="primary" @click="editPoc(item)">编辑</el-button>
            <el-button type="primary" @click="delPoc(item.id)">删除</el-button> -->
          </div>
        </div>
      </div>
      <div class="pagination_box">
        <Pagination 
        v-model="currentPage" 
        :total="pocCount" 
        @change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.poc_container{
  width: 100%;
  height: 100%;
  .poc_left{
    width: fit-content;
    height: 100%;
  }
}
.poc_box{
  width: calc(100% - 2.87rem);
  height: 100%;
  padding: 0.88rem 0.83rem 0 1.48rem;
  .poc_tit{
    margin-bottom: 0.55rem;
  }
  .poc_search{
    width: 3.04rem;
    height: 0.32rem;
    margin-bottom: 0.43rem;
    input{
      width: 100%;
      height: 100%;
      border: 1px solid var(--theme);
      border-radius: 0.18rem;
      text-indent: 0.21rem;
    }
    input:focus{
      outline: none;
      border: 1px solid var(--theme);
    }
    img{
      position: absolute;
      right: 0.15rem; 
      top: 0.09rem;
    }
  }
}
.poc_list{
  align-items: flex-start;
  align-content: flex-start;
  flex-wrap: wrap;
  width: 14rem;
  height: 6.5rem;
  gap: 0.4rem 0.5rem;
  .poc_item{
    width: 3.04rem;
    height: 1.82rem;
    border: 1px solid #ccc;
    padding: 0.25rem 0.3rem;
    box-shadow: 0px 0px 3px 16px #5B9BFF0F;
    .time{
      color: #9FA2A5;
      margin-bottom: 0.2rem;
      img{
        margin-right: 0.07rem;
      }
    }
    .name{
      height: 0.3rem;
      line-height: 0.3rem;
      margin-bottom: 0.1rem;
      color: var(--text-t);
      margin-bottom: 0.35rem;
    }
    .btn_box{
      .btn{
        width: 0.82rem;
        height: 0.25rem;
        background-color: var(--bg-color);
        color: var(--theme);
      }
      .btn:hover{ 
        background-color: var(--theme);
        color: white;
      }
      img{
        width: 0.2rem;
        height: 0.2rem;
      }
      img:hover{
        filter: brightness(0.5);
      }
    }
  }
}
.poc_form{
  .item{
    margin-bottom: 0.2rem;
  }
}
</style>