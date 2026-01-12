import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { pocApi } from '@/utils/http';
import {
  fenziPumpBaseList,
  valveBaseList,
  ganPumpBaseList,
  liziPumpBaseList,
  youPumpBaseList,
} from '@/assets/js/modelBaseInfo';

export const useModelStore = defineStore('model', () => {
  const modelsLoaded = ref<boolean>(false);
  const loading = ref<boolean>(false);

  const clearLists = () => {
    fenziPumpBaseList.length = 0;
    ganPumpBaseList.length = 0;
    liziPumpBaseList.length = 0;
    youPumpBaseList.length = 0;
    valveBaseList.length = 0;
  };

  const loadModelList = async () => {
    if (loading.value) return;
    loading.value = true;
    // 每次加载前清空，保证刷新后是最新数据
    clearLists();
    try {
      const res: any = await pocApi.getModelList();
      const modelArray = Array.isArray(res) ? res : res?.results || res?.data || [];
      modelArray.forEach((item: any) => {
        if (item.model_name.includes('turbo')) {
          fenziPumpBaseList.push({
            name: item.model_name,
            ...item.model_json,
          });
        } else if (item.model_name.includes('dry')) {
          ganPumpBaseList.push({
            name: item.model_name,
            ...item.model_json,
          });
        } else if (item.model_name.includes('ion')) {
          liziPumpBaseList.push({
            name: item.model_name,
            ...item.model_json,
          });
        } else if (item.model_name.includes('oil')) {
          youPumpBaseList.push({
            name: item.model_name,
            ...item.model_json,
          });
        } else if (item.model_name.includes('valve')) {
          valveBaseList.push({
            name: item.model_name,
            ...item.model_json,
          });
        }
      });
      modelsLoaded.value = true;
      console.log('模型列表加载完成', {
        fenziPumpBaseList: fenziPumpBaseList.length,
        ganPumpBaseList: ganPumpBaseList.length,
        liziPumpBaseList: liziPumpBaseList.length,
        youPumpBaseList: youPumpBaseList.length,
        valveBaseList: valveBaseList.length,
      });
    } catch (err) {
      console.error('加载模型列表失败:', err);
      ElMessage.error('加载模型列表失败，请刷新页面重试');
    } finally {
      loading.value = false;
    }
  };

  return {
    modelsLoaded,
    loading,
    loadModelList,
  };
});
