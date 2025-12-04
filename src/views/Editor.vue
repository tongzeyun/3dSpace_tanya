<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import Header from '@/components/Editor/editorHeader.vue';
// import RightAside from '@/components/Editor/rightAside_old.vue';
import RightAside from '@/components/Editor/rightAside.vue';
import { useProjectStore } from '@/store/project';
import { ref , onMounted , computed } from 'vue';
import { chamberBaseOptions , pipeBaseOptions , bendBaseOptions , teeBaseOptions} from '@/assets/js/modelBaseInfo';
import Layer from '@/components/Layout/markLayer.vue';
  const cvsDom = ref(null) as any;
  const projectStore = useProjectStore();
  // const { proxy } = getCurrentInstance() as any
  const popVisiable = ref<boolean>(false)
  // const menuList = ref(projectStore.menuLists)
  const menuPos = computed(() => {
    return{
      x: projectStore.menuPos.x,
      y: projectStore.menuPos.y
    }
  })
  onMounted(() => {
    // projectStore.modelList.forEach((item:any) => {
    //   if(item.type === 'Chamber'){
    //     item.initClass = cvsDom.value.addChamberModel(item.cType,item)
    //   }else if(item.type == 'Pipe'){
    //     item.initClass = cvsDom.value.addPipeModel(item)
    //   }
    // })
    cvsDom.value.addChamberModel(chamberBaseOptions.cType,chamberBaseOptions)
    
    // console.log(projectStore.modelList)
  })

  // const handleUpdateChamber = () => {
  //   console.log('main_handleUpdateChamber')
  //   // cvsDom.value.addChamberModel(projectStore.modelList[0].cType,projectStore.modelList[0])
  // }
  // const handleShowMenu = (data:any) => {
  //   console.log('handleShowMenu===>',data)
  //   // menuPos.value = data.pos
  //   // menuVisiable.value = true
  // }

  const menuClick = (type:string,subType?:string) => {
    // TODO: 对于多端管道添加后续管道交互方案
    // if(projectStore.activeGroup.type == 'TeePipe' ){
    //   popVisiable.value = true
    // }else{
    //   if(type == '0'){
    //     cvsDom.value.addPipeModel(pipeBaseOptions)
    //   }else if( type == '1'){
    //     cvsDom.value.addBendModel(bendBaseOptions)
    //   }else if (type == '2'){
    //     cvsDom.value.addTeeModel(teeBaseOptions,subType)
    //   }
    //   projectStore.menuVisiable = false
    // }
    if(type == '0'){
      cvsDom.value.addPipeModel(pipeBaseOptions)
    }else if( type == '1'){
      cvsDom.value.addBendModel(bendBaseOptions)
    }else if (type == '2'){
      cvsDom.value.addTeeModel(teeBaseOptions,subType)
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
        <RightAside @updateChamber="handleUpdateChamber"></RightAside>
      </div>
    </div>
    <Layer v-model="popVisiable" :width="'4rem'">
      <slot>
        <div class="pop_box base_box">
          <div class="title f24">请选择所要添加的端口</div>
          <div class="list_box">
            <el-checkbox label="端口1" value="Value 1" />
            <el-checkbox label="端口2" value="Value 1" />
          </div>
          <div class="btn_box">
            <el-button @click="">Ok</el-button>
            <el-button @click="popVisiable = false">Cancal</el-button>
          </div>
        </div>
      </slot>
    </Layer>
  </div>
</template>
<style lang="scss" scoped>
.edit_container{
  width: 100vw;
  height: 100vh;
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
    overflow: hidden;
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
