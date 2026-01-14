<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import Header from '@/components/Editor/editorHeader.vue';
import RightAside from '@/components/Editor/rightAside.vue';
import { useProjectStore } from '@/store/project';
import { ref , onMounted , computed } from 'vue';
import { 
  chamberBaseOptions,
  bendBaseOptions,
} from '@/assets/js/modelBaseInfo';
import { Port } from '@/utils/model-fuc/Port';
// import Layer from '@/components/Layout/markLayer.vue';
  const cvsDom = ref(null) as any;
  const projectStore = useProjectStore();
  // const { proxy } = getCurrentInstance() as any
  // const popVisiable = ref<boolean>(false)
  // const menuList = ref(projectStore.menuLists)
  const menuPos = computed(() => {
    return{
      x: projectStore.menuPos.x,
      y: projectStore.menuPos.y
    }
  })
  onMounted(() => {
    cvsDom.value.addChamberModel(chamberBaseOptions)
    // analyzSceneData()
    // testModel()
  })

  // 解析场景数据
  const analyzSceneData = () => {
    if(projectStore.projectInfo.modelList.length == 0) return
    projectStore.projectInfo.modelList.forEach((item:any) => {
      console.log('item',item)
      if(item.type == 'Chamber'){
        let obj = Object.assign(chamberBaseOptions,item)
        cvsDom.value.addChamberModel(obj)
      }else if(item.type == 'Pipe'){
        cvsDom.value.addPipeModel()
      }else if(item.type == 'Bend'){
        cvsDom.value.addBendModel(bendBaseOptions)
      }
    })
  }

  const menuClick = (type:string,subType?:string) => {
    if(type == '0'){
      cvsDom.value.addPipeModel()
    }else if( type == '1'){
      cvsDom.value.addBendModel(bendBaseOptions)
    }else if (type == '2'){
      cvsDom.value.addTeeModel(subType)
    }else if(type == '3'){
      cvsDom.value.addCrossPipeModel()
    }else if(type == '4'){
      cvsDom.value.addLTubeModel()
    }else if(type == '5'){
      cvsDom.value.addReducerModel()
    }else if(type == '6'){
      cvsDom.value.addGLBModel(subType)
    }else if(type == '7'){
      // 添加阀门
      cvsDom.value.addValveModel()
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
    console.log('handleUpdateChamber')
    cvsDom.value.addChamberModel(data.cType,data)
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
  }


  // // TODO: 测试模型
  // const testModelList = [
  //   {url:'./test_model/model_1.glb',pos:{x:2,y:0,z:0}},
  //   {url:'./test_model/model_2.glb',pos:{x:4,y:0,z:0}},
  //   {url:'./test_model/model_2.glb',pos:{x:4,y:0,z:2}},
  //   {url:'./test_model/model_3.glb',pos:{x:6,y:0,z:0}},
  //   {url:'./test_model/model_5.glb',pos:{x:0,y:0,z:0}},
  // ]
  // const testModel = () => { 
  //   testModelList.forEach(async (item) => { 
  //     await cvsDom.value.addGLBModel(item)
  //   })
  // }
</script>
<template>
  <div class="edit_container base-box">
    <div class="edit_header">
      <Header></Header>
    </div>
    <div class="edit_box flex-sb">
      <div class="cvs_box base-box">
        <MyCanvas ref="cvsDom"></MyCanvas>
        <div v-if="projectStore.menuVisiable" class="menu_box base-box" 
          :style="{transform:`translate3d(${menuPos.x+90}px,${menuPos.y+50}px,0) translate(-50% , -50%)`}">
          <div class="menu_item f18" v-for="ele in projectStore.menuList">
            <div class="item" @click="menuClick(ele.type)" @mouseenter="mouseEnterMenu(ele)">
              {{ ele.title }}
            </div>
            <div class="sub_menu base-box" v-if="ele.subMenu&&ele.isShow">
              <div class="sub_menu_item" v-for="item in ele.subMenu" @click="menuClick(ele.type,item.type)">
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
</template>
<style lang="scss" scoped>
.edit_container{
  width: 100%;
  height: 100%;
}
.edit_header{
  width: 100%;
  height: 0.8rem;
  // position: absolute;
  // top: 0;
  // left: 0;
  z-index: 10;
}
.edit_box{
  width: 100%;
  height: calc(100vh - 0.8rem);
  .cvs_box{
    height: 100%;
    z-index: 1;
    width: calc(100% - 4.8rem);
    // overflow: hidden;
  }
  .right_aside{
    width: 4.8rem;
    height: 100%;
    background-color: white;
  }
}
.menu_box{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  width: 1.3rem;
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
