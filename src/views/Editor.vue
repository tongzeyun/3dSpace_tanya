<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import Header from '@/components/Editor/editorHeader.vue';
// import RightAside from '@/components/Editor/rightAside_old.vue';
import RightAside from '@/components/Editor/rightAside.vue';
import { useProjectStore } from '@/store/project';
import { ref , onMounted , computed} from 'vue';
import { chamberBaseOptions } from '@/assets/js/modelBaseInfo';
  const cvsDom = ref(null) as any;
  const projectStore = useProjectStore();
  // const menuVisiable = ref<boolean>(false)
  const menuList = ref<any>([
    {title:'添加直管',type:'0'},
    {title:'添加弯管',type:'1'},
    {title:'添加泵',type:'2'},
  ])
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
    
    console.log(projectStore.modelList)
  })

  const handleUpdateChamber = () => {
    console.log('main_handleUpdateChamber')
    cvsDom.value.addChamberModel(projectStore.modelList[0].cType,projectStore.modelList[0])
  }
  const handleShowMenu = (data:any) => {
    console.log('handleShowMenu===>',data)
    // menuPos.value = data.pos
    // menuVisiable.value = true
  }

  const menuClick = (type:string) => {
    if(type == '0'){
      cvsDom.value.addPipeModel(projectStore.pipeBaseOptions)
    }
  }
</script>
<template>
  <div class="edit_container base-box">
    <div class="edit_header">
      <Header></Header>
    </div>
    <div class="edit_box flex-sb">
      <div class="cvs_box base-box">
        <MyCanvas ref="cvsDom" @showMenu="handleShowMenu"></MyCanvas>
        <div v-if="projectStore.menuVisiable" class="menu_box base-box" 
          :style="{transform:`translate3d(${menuPos.x+80}px,${menuPos.y+50}px,0) translate(-50% , -50%)`}">
          <div class="menu_item f18" v-for="ele in menuList" @click="menuClick(ele.type)">
            {{ ele.title }}
          </div>
        </div>
      </div>
      <div class="left_aside">
        <RightAside  @updateChamber="handleUpdateChamber"></RightAside>
      </div>
    </div>
    
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
  }
  .left_aside{
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
  width: 1rem;
  height: fit-content;
  background-color: #aaaaaa;
  border-radius: 4px;
  min-height: 20px;
  color: black;
  padding: 5px;
  .menu_item{
    cursor: pointer;
    user-select: none;
  }
  .menu_item:hover{
    background-color: #dddddd;
    color: var(--theme);
  }
}
</style>
