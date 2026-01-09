/**
 * @Author: Travis
 * @Date: 2026-01-08 10:11:40
 * @Description: 用户项目管理页面
 * @LastEditTime: 2026-01-08 10:11:40
 * @LastEditors: Travis
 */
<script setup lang="ts">
import { pocApi } from '@/utils/http';
import { ref , onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userInfo';
import { useProjectStore } from '@/store/project';
import { ElMessage, ElMessageBox } from 'element-plus';
// import { gasTypeOptions } from '@/assets/js/projectInfo';
// import { useI18n } from 'vue-i18n'

  // const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()
  const projectStore = useProjectStore()
  const addPopVisable = ref<boolean>(false)
  const pocList = ref<any[]>([])
  const pocForm = reactive<any>({
    name:''
  })
  onMounted(() => {
    getPocListFun()
  })
  const getPocListFun = () => {
    pocApi.getPocList({
      page: 1,
      pageSize: 10
    }).then((res:any) => {
      pocList.value = res.results
      console.log('res',res)
    }).catch(err => {
      console.error('err',err)
    })
  }

  const createPoc = () => {
    pocApi.createPoc({
      user:userStore.userInfo.id,
      project_name: pocForm.name,
      project_json:{},
    }).then((res:any) => {
      // console.log('res',res)
      getPocListFun()
      // projectStore.setProjectInfo(res)
      projectStore.projectInfo.name = res.name
      projectStore.projectInfo.id = res.id
      addPopVisable.value = false
      clearForm()
      ElMessage({
        type: 'success',
        message: '创建成功!',
      })
    })
  }

  const editPoc = (item:any) => {
    console.log('item',item)
    projectStore.projectInfo.name = item.project_name
    projectStore.projectInfo.user = item.user
    projectStore.projectInfo.id = item.id
    projectStore.projectInfo.modelList = JSON.parse(item.project_json)
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
  const clearForm = () => {
    pocForm.name = ''
  }
</script>
<template>
  <div class="poc_container base-box">
    <div class="poc_header">
      <el-button type="primary" @click="addPopVisable = true">新建项目</el-button>
    </div>
    <div class="poc_list flex-fs">
      <div class="poc_item base round" v-for="item in pocList">
        <div class="name f24">{{ item.project_name }}</div>
        <div class="btn flex-fs">
          <el-button type="primary" @click="editPoc(item)">编辑</el-button>
          <el-button type="primary" @click="delPoc(item.id)">删除</el-button>
        </div>
      </div>
    </div>
    <el-dialog v-model="addPopVisable" title="Tips" width="500">
      <template #header>
        <div class="f20 fB">新建项目</div>
      </template>
      <template #default>
        <div class="poc_form">
          <div class="item">
            <el-input v-model="pocForm.name" placeholder="请输入项目名称"></el-input>
          </div>
          <!-- <div class="item">
            <el-select v-model="projectStore.projectInfo.gasType" value-key="id">
              <el-option
                v-for="item in gasTypeOptions"
                :key="item.id"
                :label="item.title"
                :value="item.value"
              />
            </el-select>
          </div> -->
        </div>
      </template>
      <template #footer>
        <div class="dialog_footer flex-fs">
          <el-button @click="addPopVisable = false">取消</el-button>
          <el-button type="primary" @click="createPoc">完成</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.poc_container{
  width: 100%;
  height: 100%;
  padding: 0.2rem;
  .poc_header{
    height: fit-content;
    margin-top: 0rem;
  }
}
.poc_list{
  margin-top: 0.2rem;
  .poc_item{
    width: 2rem;
    margin-right: 0.2rem;
    border: 1px solid #ccc;
    padding: 0.1rem;
    .name{
      margin-bottom: 0.1rem;
    }
  }
}
.poc_form{
  .item{
    margin-bottom: 0.2rem;
  }
}
</style>