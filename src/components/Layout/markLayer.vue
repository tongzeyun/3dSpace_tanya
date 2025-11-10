<template>
  <Teleport to="body" :disabled="false">
    <div v-bind="$attrs" v-if="modelValue" class="maskLayer-overlay" :style="{ background }" >
      <div class="maskLayer-content" :style="{ width:props.width,height:props.height }" @click.stop>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script lang='ts' setup>
// import { useAttrs } from 'vue';

// const attrs = useAttrs()
// console.log(attrs)
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  background: {
    type: String,
    default: 'rgba(0, 0, 0, 0.5)'
  },
  // appendToBody为false时禁用Teleport,此时该组件不会发送到body下
  appendToBody: {
    type: Boolean,
    default: true
  },
  width:{
    type:String,
  },
  height:{
    type:String,
  }
})

const emits = defineEmits(['handleCancal'])

// const cancal = () => {
//   emits('handleCancal')
//   // props.modelValue = false
// }
</script>

<style lang='scss' scoped>
.maskLayer-overlay{
  position: fixed;
  margin: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // height: fit-content;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  .maskLayer-content{
    width: 100%;
    height: fit-content;
    // display: flex;
    // justify-content: center;
  }
}
</style>