import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { modelApi } from '@/utils/http';
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

// 法兰接口
export interface Flange {
  id: number;
  type: 'inlet' | 'outlet'; // 进气法兰或出气法兰
  position: string; // 位置，如 '+X', '-X' 等
  diameter: number; // 口径
  isActive?: boolean; // 是否激活状态
}

export const useModelStore = defineStore('model', () => {
  const modelsLoaded = ref<boolean>(false);
  const loading = ref<boolean>(false);

  // 导入模型相关的用户控制数据
  const importModel = reactive({
    // 模型缩放值
    modelScale: 1,
    // 选中的法兰口径
    // selectedDiameter: flangeDiameterOptions[0].value,
    // 法兰位置
    // selectedDir: '+X',
    // 模型正方向
    modelDir: '+X',
    // 用户添加的法兰数组
    userAddedFlanges: [] as Flange[],
    // 当前激活的法兰ID
    activeFlangeId: null as number | null,
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
    // 泵类型
    pumpType:''
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
      const res: any = await modelApi.getPublicPumpList();
      const modelArray = Array.isArray(res) ? res : res?.results || res?.data || [];
      modelArray.forEach((item: any) => {
        switch (item.pump_type) {
          case 'turbo':
            fenziPumpBaseList.push(item);
            break;
          case 'dry':
            ganPumpBaseList.push(item);
            break;
          case 'ion':
            liziPumpBaseList.push(item);
            break;
          case 'oil':
            youPumpBaseList.push(item);
            break;
          default:
            break;
        }
      });
      modelsLoaded.value = true;
      console.log('模型列表加载完成', {
        fenziPumpBaseList: fenziPumpBaseList.length,
        ganPumpBaseList: ganPumpBaseList.length,
        liziPumpBaseList: liziPumpBaseList.length,
        youPumpBaseList: youPumpBaseList.length,
      });
    } catch (err) {
      console.error('加载模型列表失败:', err);
      ElMessage.error('加载模型列表失败，请刷新页面重试');
    } finally {
      loading.value = false;
    }
  };

  const loadValveList = async () => {
    // 每次加载前清空，保证刷新后是最新数据
    // clearLists();
    valveBaseList.length = 0;
    try {
      const res: any = await modelApi.getPublicValveList();
      const modelArray = Array.isArray(res) ? res : res?.results || res?.data || [];
      modelArray.forEach((item: any) => {
        valveBaseList.push(item);
      })

    }catch (err) {
      console.error('加载阀门列表失败:', err);
      ElMessage.error('加载阀门列表失败，请刷新页面重试');
    }
  }

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

  // 检查是否已存在指定类型的法兰
  const hasFlangeType = (type: 'inlet' | 'outlet'): boolean => {
    return importModel.userAddedFlanges.some(f => f.type === type);
  };

  // 添加法兰
  const addFlange = (type: 'inlet' | 'outlet') => {
    // 检查是否已存在同类型的法兰
    if (hasFlangeType(type)) {
      ElMessage.warning(`最多只能添加一个${type === 'inlet' ? '进气' : '出气'}法兰`);
      return false;
    }

    const newFlange: Flange = {
      id: Date.now(),
      type,
      position: '+X',
      diameter: flangeDiameterOptions[3].value,
      isActive: false
    };
    importModel.userAddedFlanges.push(newFlange);
    // 设置新添加的法兰为激活状态
    setActiveFlange(newFlange.id);
    return true;
  };

  // 删除法兰
  const deleteFlange = (id: number) => {
    const index = importModel.userAddedFlanges.findIndex(flange => flange.id === id);
    if (index > -1) {
      importModel.userAddedFlanges.splice(index, 1);
      // 如果删除的是当前激活的法兰，清空激活状态
      if (importModel.activeFlangeId === id) {
        importModel.activeFlangeId = null;
      }
    }
  };

  // 设置激活法兰
  const setActiveFlange = (id: number | null) => {
    // 先清空所有法兰的激活状态
    importModel.userAddedFlanges.forEach(flange => {
      flange.isActive = false;
    });
    // 设置新的激活法兰
    importModel.activeFlangeId = id;
    if (id !== null) {
      const flange = importModel.userAddedFlanges.find(f => f.id === id);
      if (flange) {
        flange.isActive = true;
      }
    }
  };

  // 获取当前激活的法兰
  const getActiveFlange = () => {
    return importModel.userAddedFlanges.find(flange => flange.isActive) || null;
  };

  // 更新法兰属性
  const updateFlange = (id: number, updates: Partial<Pick<Flange, 'position' | 'diameter'>>) => {
    const flange = importModel.userAddedFlanges.find(f => f.id === id);
    if (flange) {
      if (updates.position !== undefined) {
        flange.position = updates.position;
      }
      if (updates.diameter !== undefined) {
        flange.diameter = updates.diameter;
      }
      return true;
    }
    return false;
  };

  // 清空导入模型相关数据
  const clearImportModelData = () => {
    importModel.modelScale = 1;
    // importModel.selectedDiameter = flangeDiameterOptions[0].value;
    // importModel.selectedDir = '+X';
    importModel.userAddedFlanges = [];
    importModel.activeFlangeId = null;
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
      // let outFlange
      // let inFlange
      let obj = {
        pump_name: importModel.pumpDataName,
        pump_type: importModel.pumpType,
        // diameter: importModel.selectedDiameter,
        pressure_unit: importModel.pressureUnit,
        speed_unit_1: importModel.extractionSpeedUnit1,
        speed_unit_2: importModel.extractionSpeedUnit2,
        speed_curve: importModel.pumpDataRows.map(row => ({
          pressure: row.pressure,
          speed: row.extractionSpeed,
        })),
        outOffset: [0],
        outdir: [0],
        inOffset: [0],
        indir: [0],
        scale: [importModel.modelScale, importModel.modelScale, importModel.modelScale],
        modelDir: importModel.modelDir,
        
      }
      const params = new FormData();

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
    loadValveList,
    saveEditData,
    importModel,
    addPumpDataRow,
    deletePumpDataRow,
    clearImportModelData,
    addFlange,
    deleteFlange,
    setActiveFlange,
    getActiveFlange,
    updateFlange,
    hasFlangeType,
  };
});
