<script lang="ts" setup>
import MyCanvas from '@/components/Editor/myCanvas.vue';
import Header from '@/components/Editor/editorHeader.vue';
import RightAside from '@/components/Editor/rightAside.vue';
import { useProjectStore } from '@/store/project';
import { ref , onMounted} from 'vue';

  const cvsDom = ref(null) as any;
  const projectStore = useProjectStore();

  onMounted(() => {
    projectStore.modelList.forEach((item:any) => {
      if(item.type === 'Chamber'){
        item.initClass = cvsDom.value.addChamberModel(item.cType,item)
      }else if(item.type == 'Pipe'){
        item.initClass =  cvsDom.value.addPipeModel(item)
      }
    })
    console.log(projectStore.modelList)
  })

  const handleUpdateChamber = () => {
    console.log('main_handleUpdateChamber')
    cvsDom.value.addChamberModel(projectStore.modelList[0].cType,projectStore.modelList[0])
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

</style>
