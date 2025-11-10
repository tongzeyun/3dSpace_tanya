
<template>
  <Teleport to="body">
    <Transition enter-active-class="animate__animated animate__bounceInRight"
      leave-active-class="animate__animated animate__bounceOutRight">
      <div v-if="isShow" class="message" :class="className">{{ tipText }}</div>
    </Transition>
  </Teleport>
</template>
 
<script setup lang='ts'>
import { ref } from 'vue';
let isShow = ref<boolean>(false)
let tipText = ref<string>('')
let className = ref<string>('')
// let colorList = reactive<any>({
//   success : 'green',
//   error :'red'
// })
const show = (str: string , type:string ,time: number = 2000) => {
  // console.log(str)
  tipText.value = str
  isShow.value = true
  className.value = type
  
  setTimeout(() => {
    isShow.value = false
  }, time);
}
const hide = () => isShow.value = false
// 将组件内部的方法导出，方便外部访问
defineExpose({
  show,
  hide
})
</script>
 
<style lang='scss' scoped>
.message {
  height: 0.4rem;
  line-height: 0.4rem;
  padding: 0 0.3rem;
  border-radius: 5px;
  background-color: rgba(200, 217, 217, 0.5);
  position: fixed;
  top: 0.8rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.16rem;
  z-index: 4000;
}
.success{
  background-color: #1C2518;
  border: 1px solid #212F1A;
  color: #67C23A;
}
.error{
  background-color: #2B1D1D;
  border: 1px solid #3B2424;
  color: #F56C6C;
}
</style>