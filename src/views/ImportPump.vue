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
import { ElMessage, ElMessageBox } from 'element-plus';
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
        // 模型加载成功后，保存文件到 store
        modelStore.modelFile = file;
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
const handleAddFlange = (type:'inlet' | 'outlet') => {
  // 检查是否已存在进气法兰
  if (modelStore.hasFlangeType(type)) {
    ElMessage.warning(`最多只能添加一个${type}法兰`);
    return;
  }

  // 先添加法兰到store，获取默认值
  const added = modelStore.addFlange(type);
  if (!added) {
    return;
  }

  // 获取刚添加的法兰，使用其默认直径
  const newFlange = modelStore.getActiveFlange();
  if (!newFlange) {
    return;
  }

  if (canvasRef.value) {
    const success = canvasRef.value.addFlange(added);
    if (success) {
      ElMessage.success(`已添加${type}法兰 (${newFlange.diameter})`);
    } else {
      // 如果场景添加失败，从store中删除
      modelStore.deleteFlange(newFlange.id);
      ElMessage.error('添加进气法兰失败，请重试');
    }
  }
};

// 处理删除选中的法兰
const handleDeleteSelectedFlange = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除选中的法兰吗？',
      '删除提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    if (canvasRef.value) {
      const deleted = canvasRef.value.deleteSelectedFlange();
      if (deleted) {
        // 获取当前激活的法兰ID并在store中删除
        const activeFlange = modelStore.getActiveFlange();
        if (activeFlange) {
          modelStore.deleteFlange(activeFlange.id);
        }
        ElMessage.success('已删除选中的法兰');
      } else {
        ElMessage.warning('请先选中一个法兰');
      }
    }
  } catch {
    // 用户取消删除
  }
};

  // 处理模型缩放值更新（从 Canvas 组件同步）
  const handleScaleUpdated = (scale: number) => {
    modelScaleValue.value = scale;
  };

  // 处理法兰选中事件
  const handleFlangeSelected = (id:number | null) => {
    modelStore.setActiveFlange(id);
  };

  // 处理法兰更新事件
  const handleFlangeUpdated = (id: number, value: string | number) => {
    if (canvasRef.value) {
      const activeFlange = modelStore.getActiveFlange();
      if (activeFlange && activeFlange.id === id) {
        const success = canvasRef.value.updateSelectedFlangeDiameter(value as number);
        if (!success) {
          ElMessage.error('更新法兰口径失败');
        }
      }
    }
  };

  const submitModel = () => {
    // 保存前计算所有法兰的偏移量
    if (canvasRef.value) {
      canvasRef.value.caleFlangeOffset(modelStore.importModel.userAddedFlanges);
    }
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
        <Canvas 
          ref="canvasRef" 
          @scale-updated="handleScaleUpdated"
          @flange-selected="handleFlangeSelected"
        ></Canvas>
      </div>
      <div class="right_aside">
        <RightAside
          :model-scale-value="modelScaleValue"
          @scale-change="handleScaleChange"
          @add-flange="handleAddFlange"
          @delete-selected-flange="handleDeleteSelectedFlange"
          @flange-updated="handleFlangeUpdated"
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