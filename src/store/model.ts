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
export interface FlangeTmp {
  id: number;
  type: 'inlet' | 'outlet'; // 进气法兰或出气法兰
  dir: string; // 位置，如 '+X', '-X' 等
  offset: [number, number, number]; // 偏移量
  diameter: number; // 口径
  isActive?: boolean; // 是否激活状态
}

const dirOptions: Record<string, [number, number, number]> = {
  '+X': [1, 0, 0],
  '-X': [-1, 0, 0],
  '+Y': [0, 1, 0],
  '-Y': [0, -1, 0],
  '+Z': [0, 0, 1],
  '-Z': [0, 0, -1],
}

export const useModelStore = defineStore('model', () => {
  const modelsLoaded = ref<boolean>(false);
  const loading = ref<boolean>(false);
  const modelFile = ref<File | null>(null);
  const userModels = ref<any[]>([]); // 用户自定义模型列表
  // 导入模型相关的用户控制数据
  const importModel = reactive({
    // 模型缩放值
    modelScale: 1,
    // 模型正方向
    modelDir: '+X',
    // 用户添加的法兰数组
    userAddedFlanges: [] as FlangeTmp[],
    // 当前激活的法兰ID
    activeFlangeId: null as number | null,
    // 泵数据表格相关
    pumpDataRows: [] as PumpDataRow[],
    newPressure: null as number | null,
    newExtractionSpeed: null as number | null,
    // 压力单位
    pressureUnit: 'mbar',
    // 抽取速度单位
    speed_unit_v: 'm3',
    speed_unit_t: 'hr',
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

  const loadPublicModelList = async () => {
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
      // console.log('公用模型列表加载完成', {
      //   fenziPumpBaseList: fenziPumpBaseList.length,
      //   ganPumpBaseList: ganPumpBaseList.length,
      //   liziPumpBaseList: liziPumpBaseList.length,
      //   youPumpBaseList: youPumpBaseList.length,
      // });
    } catch (err) {
      console.error('加载模型列表失败:', err);
      ElMessage.error('加载模型列表失败，请刷新页面重试');
    } finally {
      loading.value = false;
    }
  };
  const loadUserModelList = async () => { 
    // 每次加载前清空，保证刷新后是最新数据
    clearLists();
    try {
      const res2: any = await modelApi.getPumpList({page:1, page_size:1000});
      // console.log('用户模型列表加载完成', res2);
      userModels.value = [...res2.results];
      // console.log('用户模型列表加载完成', userModels.value);
    } catch (err) {
      console.error('加载用户模型列表失败:', err);
      ElMessage.error('加载用户模型列表失败，请刷新页面重试');
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

    const newFlange: FlangeTmp = {
      id: Date.now(),
      type,
      offset: [0, 0, 0],
      dir: '+X',
      diameter: flangeDiameterOptions[3].value,
      isActive: false
    };
    importModel.userAddedFlanges.push(newFlange);
    // 设置新添加的法兰为激活状态
    setActiveFlange(newFlange.id);
    return newFlange;
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
  const updateFlange = (id: number, updates: Partial<Pick<FlangeTmp, 'dir' | 'diameter'>>) => {
    const flange = importModel.userAddedFlanges.find(f => f.id === id);
    if (flange) {
      if (updates.dir !== undefined) {
        flange.dir = updates.dir;
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
    importModel.speed_unit_v = 'm3';
    importModel.speed_unit_t = 'hr';
    importModel.pumpDataName = '';
  };


  // 保存用户操作数据
  const saveEditData = async () => {
    // 校验：必须填写模型名称和模型类型
    if (!importModel.pumpDataName) {
      ElMessage.error('请输入模型名称');
      return;
    }
    if (!importModel.pumpType) {
      ElMessage.error('请选择模型类型');
      return;
    }
    try {
      console.log(importModel,modelFile.value)
      let outFlange = importModel.userAddedFlanges.find(f => f.type === 'outlet');
      let inFlange = importModel.userAddedFlanges.find(f => f.type === 'inlet');
      let obj: any = {
        pump_name: importModel.pumpDataName,
        pump_type: importModel.pumpType,
        pressure_unit: importModel.pressureUnit,
        speed_unit_v: importModel.speed_unit_v,
        speed_unit_t: importModel.speed_unit_t,
        speed_curve: importModel.pumpDataRows.map(row => ({
          pressure: row.pressure,
          speed: row.extractionSpeed,
        })),
        outOffset: outFlange ? outFlange.offset : [0,0,0] ,
        outdir: outFlange ? outFlange.dir : '+X',
        inOffset: inFlange ? inFlange.offset : [0,0,0] ,
        indir: inFlange ? inFlange.dir : '+X',
        scale: [importModel.modelScale, importModel.modelScale, importModel.modelScale],
        modelDir: importModel.modelDir,
        diameter: inFlange ? inFlange.diameter : 0,
      }
      obj.outdir = dirOptions[obj.outdir];
      obj.indir = dirOptions[obj.indir];
      console.log(obj)
      const params = new FormData();
      params.append('url', modelFile.value as File);
      for(let key in obj){      
        params.append(key, JSON.stringify(obj[key]));
      }
      modelApi.createPump(params).then((res:any) => {
        console.log(res)
        loadUserModelList()
      }).catch((err:any) => {
        console.error('保存失败:', err);
        ElMessage.error(err?.message || '保存失败，请重试');
      })
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
    modelFile,
    loadPublicModelList,
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
    loadUserModelList,
  };
});
