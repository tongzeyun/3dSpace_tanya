/**
 * @Author: Travis
 * @Date: 2026-02-03 14:52:01
 * @Description: 自定义分页器
 * @LastEditTime: 2026-02-03 14:52:01
 * @LastEditors: Travis
 */
<script setup lang="ts">
import { ref } from 'vue'
import imgUrl from '@/assets/imagePath'

const props = defineProps({
  modelValue: { type: Number, default: 1 }, // 支持 v-model
  total: { type: Number, default: 0 }, // 总条数
  pageSize: { type: Number, default: 12 }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 仅保留跳转输入的本地状态；当前页直接使用 props.modelValue
const jumpInput = ref<string>(String(props.modelValue))

function getTotalPages() {
  return Math.max(1, Math.ceil((props.total || 0) / props.pageSize))
}

function setPage(page: number) {
  const p = Math.min(Math.max(1, Math.floor(page)), getTotalPages())
  if (p === props.modelValue) return
  jumpInput.value = String(p)
  emit('update:modelValue', p)
  emit('change', p)
}

function prev() { if (props.modelValue > 1) setPage(props.modelValue - 1) }
function next() { if (props.modelValue < getTotalPages()) setPage(props.modelValue + 1) }

function onJump() {
  const val = Number(jumpInput.value)
  if (Number.isFinite(val) && val >= 1) {
    setPage(val)
  } else {
    jumpInput.value = String(props.modelValue)
  }
}

</script>

<template>
  <div class="pagination flex-ct f18">
    <div class="page_num fw-300">共 {{ getTotalPages() }} 页</div>
    <div class="prev round-sm flex-ct cu" :class="{disabled: props.modelValue <= 1}" @click="prev">
      <img :src="imgUrl.prev_page"/>
    </div>
    <div class="curPage fw-500 round-sm flex-ct cu">{{ props.modelValue }}</div>
    <div class="next round-sm flex-ct cu" :class="{disabled: props.modelValue >= getTotalPages()}" @click="next">
      <img :src="imgUrl.next_page"/>
    </div>
    <div class="jumpr flex-ct">
      <span class="fw-300">跳至</span>
      <input class="fw-500 flex-ct round-sm" v-model="jumpInput" @keyup.enter="onJump" @blur="onJump">
      <span class="fw-300">页</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pagination{
  width: 100%;
  .page_num{
    margin-right: 0.18rem;
  }
  .prev,
  .next,
  .curPage{
    width: 0.36rem;
    height: 0.36rem;
    border: 1px solid #9FA2A5;
    margin-right: 0.08rem;
  }
  .jumpr{
    margin-left: 0.1rem;
    input{
      width: 0.36rem;
      height: 0.36rem;
      border: 1px solid #9FA2A5;
      font-size: 0.18rem;
      text-align: center;
      padding: 0;
      margin: 0 0.06rem;
    }
    input:focus{
      outline: none;
      border: 1px solid #9FA2A5;
    }
  }
}
</style>