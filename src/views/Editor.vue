<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import LeftAside from '@/components/Editor/leftAside.vue';
import RightAside from '@/components/Editor/rightAside.vue';
import { useProjectStore } from '@/store/project';
import { useModelStore } from '@/store/model';
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
// import Layer from '@/components/Layout/markLayer.vue';
  const cvsDom = ref(null) as any;
  const projectStore = useProjectStore();
  const modelStore = useModelStore();
  const customVisiable = ref<boolean>(false)
  const menuPos = computed(() => {
    return{
      x: projectStore.menuPos.x,
      y: projectStore.menuPos.y
    }
  })
  onMounted(() => {
    console.log(projectStore.modelList)
    console.log(projectStore.activeClass)
    if(projectStore.projectInfo.modelList.length == 0){
      cvsDom.value.addChamberModel( {cType:'0'})
    }else{
      analyzSceneData()
    }
    // testModel()
  })
  onUnmounted(() => {
    sessionStorage.removeItem('project')
    projectStore.clearModelList()
  })

  const findConnectPort = (cls:any) => {
    console.log('findConnectPort',cls)
    // 获取当前模型所连接的模型数据
    let curCls = projectStore.projectInfo.modelList.find((item:any) => item.id == cls.id) as any
    if(!curCls) return
    cls.flanges.forEach((f:any) => {
      let p = f.flange.getPort()
      let curP = curCls.portList.find((ele:any) => ele.id == p.id) // 获取连接port的数据
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
    projectStore.menuList.forEach((item:any) => {
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
        <div v-if="projectStore.menuVisiable" class="menu_box base-box" 
          :style="{transform:`translate3d(${menuPos.x+90}px,${menuPos.y+50}px,0) translate(-50% , -50%)`}">
          <div class="menu_item f18" v-for="(ele,index) in projectStore.menuList" :key="index">
            <div class="item" @click="menuClick(ele.type)" @mouseenter="mouseEnterMenu(ele)">
              {{ ele.title }}
            </div>
            <div class="sub_menu base-box" v-if="ele.subMenu&&ele.isShow">
              <div class="sub_menu_item" v-for="(item,i) in ele.subMenu" :key="i" @click="menuClick(ele.type,item.type)">
                {{ item.title }}
              </div>
            </div>

            <!-- <div class="item" v-else @click="menuClick(ele.type)">{{ ele.title }}</div> -->
          </div>
        </div>
      </div>
      <div class="right_aside">
        <RightAside @updateChamber="handleUpdateChamber" @delModel="handleDelModel"></RightAside>
      </div>
    </div>
  </div>
  <el-drawer v-model="customVisiable" title="用户自定义元件" :direction="'rtl'">
    <div class="custModel_item f18" v-for="ele in modelStore.userModels" @click="addCustomModel(ele)">
      {{ ele.pump_name }}
    </div>
  </el-drawer>
</template>
<style lang="scss" scoped>
.edit_container{
  width: 100%;
  height: 100%;
}
.edit_left{
  width: fit-content;
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
    width: 2.87rem;
    height: 100%;
    background-color: white;
  }
}
.menu_box{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  width: 1.6rem;
  height: fit-content;
  background-color: #aaaaaa;
  border-radius: 4px;
  min-height: 20px;
  color: black;
  padding: 5px;
  .menu_item{
    cursor: pointer;
    user-select: none;
    .sub_menu{
      width: 100%;
      height: fit-content;
      // display: none;
      position: absolute;
      left: 105%;
      transform: translateY(-50%);
      background-color: #aaaaaa;
      padding: 5px;
      // top: 0;
    }
  }
  .item:hover{
    background-color: #dddddd;
    color: var(--theme);
  }
  .sub_menu_item:hover{
    background-color: #dddddd;
    color: var(--theme);
  }
}
.pop_box{
  width: 100%;
  height: 3rem;
  border-radius: 5px;
  background-color: white;
  padding: 0 0.1rem;
}
</style>
