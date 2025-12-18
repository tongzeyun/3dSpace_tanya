/**
 * @Author: Travis
 * @Date: 2025-12-17 10:08:42
 * @Description: 将stp,step格式的模型文件转为threejs可用模型格式
 * @LastEditTime: 2025-12-17 10:08:42
 * @LastEditors: Travis
 */

<script setup lang="ts">
import { ref } from 'vue';
import { loadStep } from '@/utils/three-fuc';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useRouter } from 'vue-router';
  
  const router = useRouter();
  const loading = ref(false);
  const fileChange = async (e:any) => {
    
    const file = e.target.files[0]
    if(!file) return
    console.log(file)
    loading.value = true;
    const blobUrl = URL.createObjectURL(file);
    try {
      const group = await loadStep(blobUrl);
      console.log(group)
      const exporter = new GLTFExporter();
      exporter.parse(
        group,
        (result:any) => {
          let output: Blob;
          let ext = '';
          if (result instanceof ArrayBuffer) {
            output = new Blob([result], { type: 'application/octet-stream' });
            ext = '.glb';
          } else {
            output = new Blob([JSON.stringify(result)], { type: 'text/plain' });
            ext = '.gltf';
          }

          const url = URL.createObjectURL(output);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name.replace(/\.(stp|step)$/i, ext);
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        (error:any)=> { console.error(error); },
        { binary: true }
      );
    }catch (err) {
      console.error('convert stp to glb failed', err);
    } finally {
      URL.revokeObjectURL(blobUrl);
      loading.value = false;
    }
  }
</script>
<template>
  <div class="container" v-loading="loading">
    <div class="des_box f20">将stp,step文件转换成GLB或GLTF</div>
    <div class="des_box f20">请选择文件</div>
    <input type="file" @change="fileChange" accept=".stp,.step" class="file_input"></input>
    <el-button @click="router.push('/')">返回</el-button>
  </div>
</template>
<style scoped lang="scss">

</style>