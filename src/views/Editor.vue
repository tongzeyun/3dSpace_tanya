<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import LeftAside from '@/components/Layout/leftAside.vue';
import RightAside from '@/components/Editor/rightAside.vue';
import Pagination from '@/components/Layout/pagination.vue';
import { useProjectStore } from '@/store/project';
import { useModelStore } from '@/store/model';
import { useUserStore } from '@/store/userInfo';
import { ref , onMounted , computed , onUnmounted} from 'vue';
// import { chamberBaseOptions } from '@/assets/js/modelBaseInfo';
import { Port } from '@/utils/model-fuc/Port';
import { HollowPipe } from '@/utils/model-fuc/HollowPipe';
import HollowBend from '@/utils/model-fuc/HollowBend';
import { TeePipe } from '@/utils/model-fuc/TeePipe';
import { CrossPipe } from '@/utils/model-fuc/CrossPipe';
import { HollowLTube } from '@/utils/model-fuc/HollowLTube';
import { ReducerPipe } from '@/utils/model-fuc/ReducerPipe';
import { PumpModel } from '@/utils/model-fuc/PumpModel';
import { ValveModel } from '@/utils/model-fuc/ValveModel';
import imgUrl from '@/assets/imagePath';
import dayjs from 'dayjs';
import { pumpTypeOptions } from '@/assets/js/projectInfo';
// import ImportPump from './ImportPump.vue';
// import Layer from '@/components/Layout/markLayer.vue';
  const cvsDom = ref(null) as any;
  const projectStore = useProjectStore();
  const modelStore = useModelStore();
  const userStore = useUserStore();
  const customVisiable = ref<boolean>(false)
  const customCurPage = ref<number>(1)
  const searchVal = ref<string>('')
  const menuPos = computed(() => {
    return{
      x: projectStore.menuPos.x,
      y: projectStore.menuPos.y
    }
  })
  onMounted( async () => {
    console.log(projectStore.modelList)
    console.log(projectStore.projectInfo)
    await modelStore.loadUserModelList(customCurPage.value,10)
    await modelStore.loadPublicModelList()
    await modelStore.loadValveList()
    if(projectStore.projectInfo.modelList.length == 0){
      cvsDom.value.addChamberModel( {cType:'0'})
    }else{
      analyzSceneData()
    }
  })
  onUnmounted(() => {
    // projectStore.clearModelList()
    // sessionStorage.removeItem('project')
    projectStore.clearModelList()
    // projectStore.$dispose()
    sessionStorage.removeItem('project')
  })

  const findConnectPort = (cls:any) => {
    console.log('findConnectPort',cls)
    // 获取当前模型所连接的模型数据
    let curCls = projectStore.projectInfo.modelList.find((item:any) => item.id == cls.id) as any
    if(!curCls) return
    cls.flanges.forEach((f:any) => {
      let p = f.flange.getPort()
      let curP = curCls.portList.find((ele:any) => ele.id == p.id) // 获取连接port的数据
      console.log('findConnectPort',curP)
      if(!curP) return
      if(curP.isConnected && curP.connected?.length > 0){
        projectStore.findCurClass(cls.getObject3D().uuid) // 选中模型
        initClsList.forEach((initCls:any) => { // 编辑将要添加的模型中port，找到curP连接的port
          initCls?.portList.forEach((port:Port) => {
            if(port.id == curP.connected){
              console.log(f.flange)
              cls.setActiveFlange(f.flange.getObject3D().uuid)
              cvsDom.value.connectFnc(initCls)
              findConnectPort(initCls)
            }
          })
        })
      }
    })
    projectStore.isSubmit = true
  }

  const getInitCls = (options:any) => {
    let obj = Object.assign(options.params,options)
    delete obj.params
    console.log('addModel options ===>',obj)
    if(options.type == 'Pipe'){
      return new HollowPipe(obj)
    }else if(options.type == 'Bend'){
      return new HollowBend(obj)
    }else if(options.type == 'Tee'){
      return new TeePipe(obj)
    }else if(options.type == 'Cross'){
      return new CrossPipe(obj)
    }else if(options.type == 'LTube'){
      return new HollowLTube(obj)
    }else if(options.type == 'Reducer'){
      return new ReducerPipe(obj)
    }else if(options.type == 'Pump'){
      return new PumpModel(obj)
    }else if(options.type == 'Valve'){
      return new ValveModel(obj)
    }
  }
  let initClsList:any = []
  // 解析场景数据
  const analyzSceneData = () => {
    if(projectStore.projectInfo.modelList.length == 0) return
    console.log(projectStore.projectInfo.modelList)
    projectStore.projectInfo.modelList.forEach((item:any) => {
      console.log('item',item)
      if(item.type == 'Chamber'){
        let obj = Object.assign(item,item.params)
        delete obj.params
        console.log('obj',obj)
        cvsDom.value.addChamberModel(obj)
      }else{
        // console.log('item',item)
        let cls = getInitCls(item)
        // console.log(cls)
        initClsList.push(cls)
      }
    })
    console.log('initClsList==>',initClsList)
    findConnectPort(projectStore.modelList[0])
  }

  const menuClick = (type:string,subType?:string) => {
    if(type == '0'){
      cvsDom.value.addPipeModel()
    }else if( type == '1'){
      cvsDom.value.addBendModel()
    }else if (type == '2'){
      cvsDom.value.addTeeModel(subType)
    }else if(type == '3'){
      cvsDom.value.addCrossPipeModel()
    }else if(type == '4'){
      cvsDom.value.addLTubeModel()
    }else if(type == '5'){
      cvsDom.value.addReducerModel()
    }else if(type == '6'){
      cvsDom.value.addGLBModel({
        modelType: subType
      })
    }else if(type == '7'){
      cvsDom.value.addValveModel()
    }else if(type == '8'){
      customVisiable.value = true
    }
    projectStore.menuVisiable = false
  }
  const mouseEnterMenu = (ele:any) => {
    userStore.menuList.forEach((item:any) => {
      item.isShow = false
    })
    ele.isShow = true
  }
  const handleUpdateChamber = (data:any) => {
    console.log('handleUpdateChamber',data)
    cvsDom.value.addChamberModel(data)
    projectStore.isSubmit = false
  }
  const handleDelModel = () => {
    // 重置所要删除模型所连接的上一模型port的状态
    let port = projectStore.activeClass.portList.find((item:any) => !item.connected && item.type == 'in')
    console.log('port',port)
    projectStore.modelList.forEach((item:any) => {
      item.portList.forEach((p:Port) => {
        if(p.connected && p.connected!.id == port.id){
          p.isConnected = false
          p.connected = null
        }
      })
    })
    cvsDom.value.delModel(projectStore.activeClass.getObject3D().uuid)
    projectStore.isSubmit = false
  }

  const addCustomModel = (data:any) => {
    console.log(data)
    cvsDom.value.addGLBModel(data)
    customVisiable.value = false
  }
  const handleCurrentChange = () => {
    modelStore.loadUserModelList(customCurPage.value,10)
  }
  const searchCustom = () => {
    customCurPage.value = 1
    modelStore.loadUserModelList(1,10,searchVal.value)
  }
  const handleChangeMark = (isShow:boolean) => {
    cvsDom.value.showMark(isShow)
  }
</script>
<template>
  <div class="edit_container base-box flex-fs" v-loading="projectStore.loading">
    <div class="edit_left">
      <LeftAside></LeftAside>
    </div>
    <div class="edit_box flex-sb">
      <div class="cvs_box base-box">
        <MyCanvas ref="cvsDom"></MyCanvas>
        <div v-if="projectStore.menuVisiable" class="menu_box base-box round-sm" 
          :style="{transform:`translate3d(${menuPos.x+130}px,${menuPos.y+130}px,0) translate(-50% , -50%)`}">
          <div class="menu_item f16" v-for="(ele,index) in userStore.menuList" :key="index">
            <div class="item flex-sb" @click="menuClick(ele.type)" @mouseenter="mouseEnterMenu(ele)">
              {{ ele.title }}
              <img class="cu" :src="imgUrl.menu_more" v-if="ele.subMenu"/>
            </div>
            <div class="sub_menu base-box round-sm" v-if="ele.subMenu&&ele.isShow">
              <div class="sub_menu_item" v-for="(item,i) in ele.subMenu" :key="i" @click="menuClick(ele.type,item.type)">
                {{ item.title }}
                <span class="f10 fw-300" v-if="item.text">({{ item.text }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="right_aside">
        <RightAside 
        :cType="(projectStore.projectInfo.modelList.find((item:any)=>item.type=='Chamber') as any)?.cType||0"
        @updateChamber="handleUpdateChamber" 
        @delModel="handleDelModel"
        @changeMark="handleChangeMark"
        ></RightAside>
      </div>
    </div>
    <el-drawer v-model="customVisiable" :direction="'rtl'">
      <div class="custom_title fw-700 f24">自定义泵</div>
      <div class="custom_search base-box">
        <input v-model="searchVal" placeholder="请输入元件名称" @blur="searchCustom">
        <img :src="imgUrl.search">
      </div>
      <div class="custom_list base-box flex-fs">
        <div class="custModel_item base-box round-sm" v-for="ele in modelStore.userModels" @click="addCustomModel(ele)">
          <div class="name f20 fw-700">{{ ele.pump_name }}</div>
          <div class="type f12 fw-300">
            类型：{{ pumpTypeOptions.find(item => item.value ==ele.pump_type)?.title || '其他' }}
          </div>
          <div class="time flex-fs f14 fw-300">
            <img :src="imgUrl.poc_time">
            {{ dayjs(ele.updated_at).format('YYYY-MM-DD') }}
          </div>
        </div>
      </div>
      <div class="pagination_box">
        <Pagination 
        v-model="customCurPage" 
        :total="modelStore.userModelsCount"
        :pageSize="10"
        @change="handleCurrentChange" />
      </div>
    </el-drawer>
  </div>
  
</template>
<style lang="scss" scoped>
.edit_container{
  width: 100%;
  height: 100%;
}
.edit_left{
  width: 2.87rem;
  height: 100%;
}
.edit_box{
  width: 100%;
  height: 100%;
  .cvs_box{
    height: 100%;
    z-index: 1;
    width: calc(100% - 2.87rem);
    // overflow: hidden;
  }
  .right_aside{
    width: 4rem;
    height: 100%;
    background-color: white;
  }
}
.menu_box{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  width: 2.85rem;
  height: fit-content;
  background-color: #F9FAFC;
  min-height: 20px;
  color: var(--text-t);
  padding: 0.22rem;
  box-shadow: 2px 2px 12px 0px #85898F59;
  .menu_item{
    cursor: pointer;
    user-select: none;
    height: 0.24rem;
    line-height: 0.24rem;
    margin-bottom: 0.25rem;
    .sub_menu{
      width: 2rem;
      height: fit-content;
      position: absolute;
      left: 101%;
      transform: translateY(-50%);
      background-color: #F9FAFC;
      padding: 0.11rem 0.17rem;
      box-shadow: 2px 2px 12px 0px #85898F59;
      .sub_menu_item{
        height: 0.24rem;
        line-height: 0.24rem;
        margin-bottom: 0.17rem;
        span{
          color: rgba(255, 119, 228, 0.78);
          margin-left: 0.03rem;
        }
      }
      .sub_menu_item:last-of-type{
        margin-bottom: 0;
      }
    }
  }
  .menu_item:last-of-type{
    margin-bottom: 0;
  }
  .item:hover{
    color: #0130FF;
    font-weight: 700;
  }
  .sub_menu_item:hover{
    color: #0130FF;
    font-weight: 700;
  }
}
.menu_box::before{
  content: '添加元件';
  width: 1.11rem;
  height: 0.44rem;
  line-height: 0.44rem;
  display: block;
  position: absolute;
  left: 0;
  top: -0.48rem;
  border-radius: 4px;
  font-size: 0.16rem;
  text-align: center;
  font-weight: 300;
  background-color: #FF77E4;
  color: white;
  box-shadow: 1px 1px 2px 0px #63677033;
}
.pop_box{
  width: 100%;
  height: 3rem;
  border-radius: 5px;
  background-color: white;
  padding: 0 0.1rem;
}
.custom_title{
  margin-bottom: 0.3rem;
}
.custom_search{
  width: 2.2rem;
  height: 0.32rem;
  margin-bottom: 0.43rem;
  input{
    width: 100%;
    height: 100%;
    border: 1px solid var(--theme);
    border-radius: 0.18rem;
    text-indent: 0.21rem;
    box-sizing: border-box;
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
.custom_list{
  width: 4.64rem;
  height: 7.1rem;
  flex-wrap: wrap;
  gap: 0.24rem;
  align-content: flex-start;
  .custModel_item{
    width: 2.2rem;
    height: 1.22rem;
    box-shadow: 0px 0px 6px 2px #646E7733;
    padding: 0.2rem;
    .name{
      color: var(--text-t);
      height: 0.3rem;
      line-height: 0.3rem;
    }
    .type{
      color: var(--text-p);
      height: 0.2rem;
      line-height: 0.2rem;
      margin-bottom: 0.2rem;
    }
    .time{
      color: var(--text-p);
      img{
        width: 0.18rem;
        height: 0.18rem;
        margin-right: 0.07rem;
      }
    }
  }
}
.pagination_box{
  margin-top: 0.5rem;

}
:deep(.el-drawer){
  width: 5.66rem !important;
}
:deep(.el-drawer__header){
  margin-bottom: 0 !important;
}
:deep(.el-drawer__body){
  padding: 0 0.5rem;
}
</style>
