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
import LeftAside from '@/components/Layout/leftAside.vue';
import imgUrl from '@/assets/imagePath';
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
  <div class="container flex-sb" v-loading="loading">
    <div class="cnv_left">
      <LeftAside></LeftAside>
    </div>
    <div class="cnv_box base-box">
      <img class="cnv_icon" :src="imgUrl.cnv_icon">
      <div class="upload_box base-box round">
        <div class="upload_tit f40 fw-700 text-c">请选择文件</div>
        <div class="upload_txt f28 fw-300 text-c">将stp，step文件转换成GLB或GLTF</div>
      </div> 
      <input type="file" @change="fileChange" accept=".stp,.step" class="file_input"></input>
    </div>
  </div>
</template>
<style scoped lang="scss">
.container{
  width: 100%;
  height: 100%;
}
.cnv_left{
  width: 2.87rem;
  height: 100%;
}
.cnv_box{
  width: calc(100% - 2.87rem);
  height: 100%;
  input{
    width: 100%;
    height: 100%;
    opacity: 0;
    position: absolute;
    left: 0;
    top: 0;
  }
  .cnv_icon{
    width: 2.8rem;
    height: 2.8rem;
    position: absolute;
    top: 1.93rem;
    left: 6.3rem;
    z-index: 10;
  }
  .upload_box{
    width: 5.4rem;
    height: 4rem;
    border: 3px dashed #9FA2A573;
    margin-top: 3.33rem;
    margin-left: 5rem;
    .upload_tit{
      color: var(--text-t);
      height: 0.6rem;
      line-height: 0.6rem;
      margin-bottom: 0.15rem;
      margin-top: 2.2rem;
    }
    .upload_txt{
      height: 0.42rem;
      line-height: 0.42rem;
      color: var(--text-d);
    }
  }
}
</style>