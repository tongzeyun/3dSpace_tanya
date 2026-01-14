/**
 * @Author: Travis
 * @Date: 2026-01-12 18:21:57
 * @Description: 用户导入模型并自定义模型数据
 * @LastEditTime: 2026-01-12 18:21:57
 * @LastEditors: Travis
 */
<script lang="ts" setup>
import { ref } from 'vue';
import Header from '@/components/ImportModel/importHeader.vue';
import Canvas from '@/components/ImportModel/Canvas.vue';
import RightAside from '@/components/ImportModel/importRight.vue';
import { ElMessage } from 'element-plus';
import { useModelStore } from '@/store/model';

// Canvas 组件引用
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 模型缩放值，用于同步到右侧边栏
const modelScaleValue = ref(1);

const modelStore = useModelStore();

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // 检查文件类型
  const validExtensions = ['.glb', '.gltf', '.fbx'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    ElMessage.error('不支持的文件格式，请上传 .glb、.gltf 或 .fbx 文件');
    return;
  }

  if (canvasRef.value) {
    canvasRef.value.loadModel(file)
      .then(() => {
        ElMessage.success('模型加载成功');
      })
      .catch((error) => {
        console.error('模型加载失败:', error);
        ElMessage.error('模型加载失败，请检查文件格式');
      });
  }

  // 清空 input，允许重复选择同一文件
  if (input) {
    input.value = '';
  }
};

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

// 处理模型缩放变化
const handleScaleChange = (scale: number) => {
  if (canvasRef.value) {
    canvasRef.value.setModelScale(scale);
  }
};

// 处理添加进气法兰
const handleAddInletFlange = (diameter: number) => {
  if (canvasRef.value) {
    canvasRef.value.addFlange('in', diameter);
    ElMessage.success(`已添加进气法兰 (${diameter}mm)`);
  }
};

// 处理添加出气法兰
const handleAddOutletFlange = (diameter: number) => {
  if (canvasRef.value) {
    canvasRef.value.addFlange('out', diameter);
    ElMessage.success(`已添加出气法兰 (${diameter}mm)`);
  }
};

// 处理删除选中的法兰
const handleDeleteSelectedFlange = () => {
  if (canvasRef.value) {
    const deleted = canvasRef.value.deleteSelectedFlange();
    if (deleted) {
      ElMessage.success('已删除选中的法兰');
    } else {
      ElMessage.warning('请先选中一个法兰');
    }
  }
};

  // 处理模型缩放值更新（从 Canvas 组件同步）
  const handleScaleUpdated = (scale: number) => {
    modelScaleValue.value = scale;
  };

  const submitModel = () => {
    modelStore.saveEditData()
  }
</script>
<template>
  <div class="pump_container">
    <div class="header f20">
      <Header @submit-model="submitModel">
        <template #upload>
          <div class="upload-section">
            <el-button type="primary" @click="triggerFileSelect">导入模型</el-button>
            <input
              ref="fileInputRef"
              type="file"
              accept=".glb,.gltf,.fbx"
              style="display: none"
              @change="handleFileUpload"
            />
          </div>
        </template>
      </Header>
    </div>
    <div class="import_box flex-sb">
      <div class="cvs_box base-box">
        <Canvas ref="canvasRef" @scale-updated="handleScaleUpdated"></Canvas>
      </div>
      <div class="right_aside">
        <RightAside
          :model-scale-value="modelScaleValue"
          @scale-change="handleScaleChange"
          @add-inlet-flange="handleAddInletFlange"
          @add-outlet-flange="handleAddOutletFlange"
          @delete-selected-flange="handleDeleteSelectedFlange"
        ></RightAside>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.pump_container{
  width: 100vw;
  height: 100vh;
  .header{
    height: 0.8rem;  
  }
}
.import_box{
  width: 100%;
  height: calc(100vh - 0.8rem);
  .cvs_box{
    height: 100%;
    z-index: 1;
    width: calc(100% - 5.5rem);
  }
  .right_aside{
    width: 5.5rem;
    height: 100%;
    background-color: white;
  }
}
</style>