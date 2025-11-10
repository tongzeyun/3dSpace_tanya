<script setup lang="ts">
import imgUrl from '@/assets/imagePath/index.ts';
import { ref,reactive } from 'vue'; 
import Layer from '@/components/Layout/markLayer.vue';
  const visible = ref<boolean>(false); 
  const form = reactive<any>({})
  let callback = reactive<any>({})
  const messageBox = (data:any,callBack:any) => {
    Object.assign(form,data)
    // console.log(form,callBack)
    callback = callBack
    visible.value = true
  }
  const confirm =() =>{
    callback('confirm')
    visible.value = false
  }
  const cancal = () =>{
    callback('cancal')
    visible.value = false
  }
  defineExpose({  
    messageBox,
  });
</script>
<template>
  <Layer v-model="visible" append-to-body>
    <div class="msgBox">
      <div class="icon" @click="cancal">
        <img :src="imgUrl.close">
      </div>
      <div class="title">
        {{ form.title }}
      </div>
      <div class="text">
        {{ form.text }}
      </div>
      <div class="btn">
        <div @click="cancal">取消</div>
        <div @click="confirm">确定</div>
      </div>
    </div>
  </Layer>
</template>
<style scoped lang="scss">
.msgBox{
  position: relative;
  width: 4rem;
  max-width: 4rem;
  height: auto;
  top: calc(50% - 2rem);
  left: calc(50% - 2rem);
  z-index: 3005;
  padding: 0.2rem;
  box-sizing: border-box;
  background-color: #222222;
  border:1px solid #181818;
  border-radius: 4px;
}
.icon{
  position: absolute;
  width: 0.16rem;
  height: 0.16rem;
  top: 0.2rem;
  right: 0.2rem;
  user-select: none;
  cursor: pointer;
  img{
    width: 100%;
    height: 100%;
    position: absolute;
  }
}
.title{
  color: white;
  font-size: 0.18rem;
  font-weight: bold;
}
.text{
  color: white;
  font-size: 0.16rem;
}
.btn{
  display: flex;
  align-items: center;
  justify-content: flex-end;
  div{
    box-sizing: border-box;
    padding: 0.05rem 0.2rem;
    font-size: 0.16rem;
    border: 1px solid #aaaa;
    border-radius: 4px;
    color: white;
    user-select: none;
    cursor: pointer;
  }
  div:nth-of-type(1){
    margin-right: 0.2rem;
  }
  div:nth-of-type(2){
    background-color: #1C9BD6;
  }
}
</style>