import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { pocApi } from '@/utils/http';
import {
  fenziPumpBaseList,
  valveBaseList,
  ganPumpBaseList,
  liziPumpBaseList,
  youPumpBaseList,
} from '@/assets/js/modelBaseInfo';
import { flangeDiameterOptions } from '@/assets/js/projectInfo';

// 泵数据行接口
export interface PumpDataRow {
  id: number;
  pressure: number | null;
  extractionSpeed: number | null;
}

export const useModelStore = defineStore('model', () => {
  const modelsLoaded = ref<boolean>(false);
  const loading = ref<boolean>(false);

  // 导入模型相关的用户控制数据（使用 reactive 组织）
  const importModel = reactive({
    // 模型缩放值
    modelScale: 1,
    // 选中的法兰口径
    selectedDiameter: flangeDiameterOptions[0].value,
    // 法兰位置
    selectedDir: '+X',
    // 泵数据表格相关
    pumpDataRows: [] as PumpDataRow[],
    newPressure: null as number | null,
    newExtractionSpeed: null as number | null,
    // 压力单位
    pressureUnit: 'mbar',
    // 抽取速度单位
    extractionSpeedUnit1: 'm3',
    extractionSpeedUnit2: 'hr',
    // 泵数据名称
    pumpDataName: '',
  });

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

  // 添加泵数据行
  const addPumpDataRow = () => {
    if (importModel.newPressure === null || importModel.newExtractionSpeed === null) {
      ElMessage.warning('请填写完整的压力和抽取速度数据');
      return;
    }

    const newRow: PumpDataRow = {
      id: Date.now(),
      pressure: importModel.newPressure,
      extractionSpeed: importModel.newExtractionSpeed,
    };

    importModel.pumpDataRows.push(newRow);
    
    // 按压力降序排序
    importModel.pumpDataRows.sort((a, b) => {
      const pressureA = a.pressure ?? 0;
      const pressureB = b.pressure ?? 0;
      return pressureB - pressureA;
    });

    // 清空输入
    importModel.newPressure = null;
    importModel.newExtractionSpeed = null;
  };

  // 删除泵数据行
  const deletePumpDataRow = (id: number) => {
    const index = importModel.pumpDataRows.findIndex(row => row.id === id);
    if (index > -1) {
      importModel.pumpDataRows.splice(index, 1);
    }
  };

  // 清空导入模型相关数据
  const clearImportModelData = () => {
    importModel.modelScale = 1;
    importModel.selectedDiameter = flangeDiameterOptions[0].value;
    importModel.selectedDir = '+X';
    importModel.pumpDataRows = [];
    importModel.newPressure = null;
    importModel.newExtractionSpeed = null;
    importModel.pressureUnit = 'mbar';
    importModel.extractionSpeedUnit1 = 'm3';
    importModel.extractionSpeedUnit2 = 'hr';
    importModel.pumpDataName = '';
  };

  // 保存用户操作数据
  const saveEditData = async () => {
    try {
      console.log(importModel)
      
      ElMessage.success('保存成功');
    } catch (error: any) {
      console.error('保存失败:', error);
      ElMessage.error(error?.message || '保存失败，请重试');
      throw error;
    }
  };

  return {
    modelsLoaded,
    loading,
    loadModelList,
    saveEditData,
    importModel,
    addPumpDataRow,
    deletePumpDataRow,
    clearImportModelData,
  };
});
