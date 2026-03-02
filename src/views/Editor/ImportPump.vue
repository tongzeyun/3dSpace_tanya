/**
 * @Author: Travis
 * @Date: 2026-01-12 18:21:57
 * @Description: 用户导入模型并自定义模型数据
 * @LastEditTime: 2026-01-12 18:21:57
 * @LastEditors: Travis
 */
<script lang="ts" setup>
import { nextTick, ref, onMounted, onUnmounted } from 'vue';
import Canvas from '@/components/ImportModel/Canvas.vue';
import RightAside from '@/components/ImportModel/importRight.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useModelStore } from '@/store/model';
import imgUrl from '@/assets/imagePath';
import { useRouter } from 'vue-router';
const router = useRouter()
// Canvas 组件引用
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null);

let _escHandler: ((e: KeyboardEvent) => void) | null = null;

const modelStore = useModelStore();
// 模型缩放值，用于同步到右侧边栏
const modelScaleValue = ref(modelStore.importModel.modelScale);
onMounted(() => {
  // 监听用户按下 Esc 键，按下时关闭弹窗
  _escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closePop();
    }
  };
  window.addEventListener('keydown', _escHandler);
  // console.log('modelStore.modelFile', modelStore.modelFile,canvasRef.value);
  if(modelStore.modelFile && canvasRef.value){
    // console.log('modelStore.importModel', modelStore.importModel);
    let size = modelStore.importModel.modelScale
    canvasRef.value.loadModel(modelStore.modelFile,size).then(() => {
      // console.log('模型加载成功');
      ElMessage.success('模型加载成功');
      // handleScaleChange(modelStore.importModel.modelScale)
      // 判断时候添加过法兰
      if(modelStore.importModel.userAddedFlanges.length && canvasRef.value){
        modelStore.importModel.userAddedFlanges.forEach((ele:any) => {
          canvasRef.value!.addFlange(ele)
        })
      }
    }).catch((error) => {
      modelStore.modelFile = null
      console.error('模型加载失败:', error);
      ElMessage.error('模型加载失败，请检查文件格式');
    });
  }
})

onUnmounted(() => {
  if (_escHandler) {
    window.removeEventListener('keydown', _escHandler);
    _escHandler = null;
  }
  // console.log('ImportPump onUnmounted');
  modelStore.clearImportModelData()
});

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  console.log('文件上传:', file);
  // 检查文件类型
  const validExtensions = ['.glb', '.gltf', '.fbx'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    ElMessage.error('不支持的文件格式，请上传 .glb、.gltf 或 .fbx 文件');
    return;
  }
  modelStore.modelFile = file;
  nextTick(() => {
    if (canvasRef.value) {
      canvasRef.value.loadModel(file).then(() => {
        // 模型加载成功后，保存文件到 store
        ElMessage.success('模型加载成功');
      })
      .catch((error) => {
        modelStore.modelFile = null
        console.error('模型加载失败:', error);
        ElMessage.error('模型加载失败，请检查文件格式');
      });
    }else{
      console.error('canvasRef is null');
    }
  });

  // 清空 input，允许重复选择同一文件
  if (input) {
    input.value = '';
  }
};


// 处理模型缩放变化
const handleScaleChange = (scale: number) => {
  console.log('缩放比例:', scale);
  if (canvasRef.value) {
    canvasRef.value.setModelScale(scale);
  }
};

// 处理添加法兰
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

  const closePop = () => {
    modelStore.importVisiable = false
  }

  const handleSubmitModel = () => {
    // 保存前计算所有法兰的偏移量
    if (canvasRef.value) {
      canvasRef.value.caleFlangeOffset(modelStore.importModel.userAddedFlanges);
    }
    modelStore.saveEditData()
  }
  const goConversion = () => {
    modelStore.importVisiable = false
    router.push('/conversion')
  }
</script>
<template>
  <div class="pump_container flex-ct round">
    <div class="upload_box base-box round flex-ct" v-if="!modelStore.modelFile">
      <img class="upload_icon" :src="imgUrl.upload_icon">
      <img class="close_icon cu" :src="imgUrl.close" @click="closePop">
      <div class="upload_txt f40 fw-500 text-c">
        {{ $t('msg.page.custTxt') }}
      </div>
      <div class="upload_tit f24 fw-300 text-c">
        {{ $t('msg.page.custTip') }}
      </div>
      <div class="goConver round-sm f20 fw-300 cu flex-ct base-box" @click="goConversion">
        <div class="text-c">{{ $t('msg.page.conver') }}</div>
        <img :src="imgUrl.go_conver">
      </div>
      <input
        class="upload_input"
        type="file"
        accept=".glb,.gltf,.fbx"
        style="display: none"
        @change="handleFileUpload"
      />
    </div>
    <div class="import_box flex-sb" v-else>
      <div class="cvs_box base-box">
        <Canvas
          ref="canvasRef" 
          @scale-updated="handleScaleUpdated"
          @flange-selected="handleFlangeSelected"
        ></Canvas>
      </div>
      <div class="right_aside base-box">
        <RightAside
          :model-scale-value="modelScaleValue"
          @scale-change="handleScaleChange"
          @add-flange="handleAddFlange"
          @delete-selected-flange="handleDeleteSelectedFlange"
          @flange-updated="handleFlangeUpdated"
          @submit-model="handleSubmitModel"
        ></RightAside>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.pump_container{
  width: 100%;
  height: 7.6rem;
  background-color: white;
}
.upload_box{
  width: 15.6rem;
  height: 7.2rem;
  border: 4px dashed #75778433;
  flex-direction: column;
  .close_icon{
    width: 0.24rem;
    height: 0.24rem;
    position: absolute;
    right: 0.64rem;
    top: 0.64rem;
    z-index: 999;
  }
  .upload_icon{
    position: absolute;
    width: 2.84rem;
    height: 1.92rem;
    top: 1.75rem;
    left: 6.6rem;
  }
  .upload_txt{
    width: 100%;
    height: 0.56rem;
    line-height: 0.56rem;
    margin-top: 1.8rem;
  }
  .upload_tit{
    width: 100%;
    color: rgba(255, 119, 119, 0.45);
  }
  .goConver{
    // width: 1.58rem;
    width: object-fit;
    height: 0.5rem;
    margin-top: 0.6rem;
    background-color: var(--theme);
    color: white;
    padding: 0 0.1rem;
    z-index: 100;
    img{
      width: 0.16rem;
      height: 0.16rem;
      margin-left: 0.16rem;
    }
  }
  .upload_input{
    width: 100%;
    height: 100%;
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
  }
}
.import_box{
  width: 100%;
  height: 100%;
  .cvs_box{
    padding: 0.2rem 0 0.2rem 0.2rem;
    height: 100%;
    z-index: 1;
    width: calc(100% - 3.44rem);
    z-index: 1;
  }
  .right_aside{
    width: 3.44rem;
    height: 100%;
    background-color: white;
    box-shadow: -19px 0px 24px 0px rgba(105, 109, 114, 0.25);
    z-index: 2;
  }
}
</style>