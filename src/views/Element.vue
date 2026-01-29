/**
 * @Author: Travis
 * @Date: 2026-01-28 17:16:13
 * @Description: 用户自定义元件管理
 * @LastEditTime: 2026-01-28 17:16:13
 * @LastEditors: Travis
 */

<script setup lang="ts">
import { onMounted } from 'vue';
import dayjs from 'dayjs';
import imgUrl from '@/assets/imagePath';
import LeftAside from '@/components/Layout/leftAside.vue';
import { useModelStore } from '@/store/model';
import { ElMessage, ElMessageBox } from 'element-plus';
import { modelApi } from '@/utils/http';

  const modelStore = useModelStore();
  onMounted(() => {
    modelStore.loadUserModelList()
  })

  // 方向映射，用于从向量反推方向标签
  const dirOptions: Record<string, [number, number, number]> = {
    '+X': [1, 0, 0],
    '-X': [-1, 0, 0],
    '+Y': [0, 1, 0],
    '-Y': [0, -1, 0],
    '+Z': [0, 0, 1],
    '-Z': [0, 0, -1],
  }

  function vecEqual(a: any[], b: any[], eps = 1e-6) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (Math.abs((a[i] || 0) - (b[i] || 0)) > eps) return false
    }
    return true
  }

  function getDirKey(vec: any[]): string {
    for (const [k, v] of Object.entries(dirOptions)) {
      if (vecEqual(v as number[], vec || [])) return k
    }
    return ''
  }
  const editEle = async (item:any) => {
    console.log('item',item)
    try {
      const res = await fetch(item.url)
      // console.log('res', res)
      if (!res.ok) {
        throw new Error(`fetch failed: ${res.status}`)
      }
      const blob = await res.blob()
      // const modelType = item.url.split('.')[1]
      // const fileName = item.pump_name || 'model'
      const fileType = blob.type || 'application/octet-stream'
      modelStore.modelFile = new File([blob], item.url, { type: fileType })

      let obj = {
        modelScale: item.scale[0],
        modelDir: item.modelDir,
        pressureUnit: item.pressure_unit,
        pumpType: item.pump_type,
        pumpDataName: item.pump_name,
        speed_unit_t: item.speed_unit_t,
        speed_unit_v: item.speed_unit_v,
        pumpDataRows: item.speed_curve.map((ele:any) => ({pressure:ele.pressure, extractionSpeed:ele.speed})),
      }
  
      if(JSON.stringify(item.inOffset) !== JSON.stringify([0,0,0])){
        modelStore.addFlange('inlet',{
          offset: item.inOffset,
          diameter: item.inDiameter || item.diameter,
          dir: getDirKey(item.indir)
        })
      }
      if(JSON.stringify(item.outOffset) !== JSON.stringify([0,0,0])){
        modelStore.addFlange('outlet',{
          offset: item.outOffset,
          diameter: item.outDiameter || item.diameter,
          dir: item.outdir
        })
      }
      modelStore.importModel = Object.assign(modelStore.importModel,obj)
      // console.log('modelStore.modelFile', modelStore.importModel)
      modelStore.importVisiable = true
    } catch (err) {
      console.error('err', err)
      ElMessage.error('加载模型失败，请重试')
    }
  }
  const delEle = (id:number) => {
    ElMessageBox.confirm('此操作将永久删除该文件, 是否继续?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      modelApi.deletePump(id).then(_res => {
        // console.log('res',res)
        ElMessage({
          type: 'success',
          message: '删除成功!',
        })
        // getPocListFun()
        modelStore.loadUserModelList()
      }).catch(err => {
        console.error('err',err)
      })
    }).catch(() => {
      
    })
  }
</script>

<template>
  <div class="poc_container base-box flex-fs">
    <div class="poc_left">
      <LeftAside></LeftAside>
    </div>
    <div class="poc_box base-box">
      <div class="poc_tit f32 fw-700">管理元件</div>
      <div class="poc_search base-box">
        <input placeholder="请输入元件名称">
        <img :src="imgUrl.search">
      </div>
      <div class="poc_list flex-fs">
        <div class="poc_item base-box round-sm" v-for="item in modelStore.userModels" :key="item.id">
          <div class="time flex-fs f14 fw-300">
            <img :src="imgUrl.poc_time">
            {{ dayjs(item.updated_at).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
          <div class="name f20 fw-700">{{ item.pump_name }}</div>
          <div class="btn_box flex-sb">
            <div class="btn cu round-sm base-box f14 flex-ct" @click="editEle(item)">编辑元件</div>
            <img class="cu" :src="imgUrl.poc_del" @click="delEle(item.id)">
            <!-- <el-button type="primary" @click="editPoc(item)">编辑</el-button>
            <el-button type="primary" @click="delPoc(item.id)">删除</el-button> -->
          </div>
        </div>
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
  padding: 0.88rem 0.83rem 0 0.83rem;
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
  flex-wrap: wrap;
  width: 14rem;
  height: 8rem;
  .poc_item{
    width: 3.04rem;
    height: 1.82rem;
    margin-right: 0.4rem;
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