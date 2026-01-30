<script lang="ts" setup>
import { ref, watch, computed, onUnmounted } from 'vue';
import { flangeDiameterOptions } from '@/assets/js/projectInfo';
import { Delete } from '@element-plus/icons-vue';
import { useModelStore } from '@/store/model';
import imgUrl from '@/assets/imagePath';
  // 定义 props，用于接收外部传入的缩放值
  const props = defineProps<{
    modelScaleValue?: number;
  }>();

  // 定义事件
  const emit = defineEmits<{
    scaleChange: [scale: number];
    addFlange: [type: 'inlet' | 'outlet'];
    deleteSelectedFlange: [];
    flangeUpdated: [id: number, value: string | number];
    submitModel:[];
  }>();

  // 使用 store
  const modelStore = useModelStore();

  // 从 store 获取导入模型相关状态（使用 reactive，保持响应式）
  const importModel = modelStore.importModel;

  // 法兰位置选项
  const dirOptions = [
    { label: '不校验模型朝向' , value: '不校验模型朝向' },
    { label: '+X' , value: '+X' },
    { label: '-X' , value: '-X' },
    { label: '+Y' , value: '+Y' },
    { label: '-Y' , value: '-Y' },
    { label: '+Z' , value: '+Z' },
    { label: '-Z' , value: '-Z' },
  ]

  const posOptions =[
    { label: '+X' , value: '+X' },
    { label: '-X' , value: '-X' },
    { label: '+Y' , value: '+Y' },
    { label: '-Y' , value: '-Y' },
    { label: '+Z' , value: '+Z' },
    { label: '-Z' , value: '-Z' },
  ]

  // Tab 激活状态
  const activeTab = ref('pumpData');
  const pressureUnitOptions = ['mbar', 'Pa', 'kPa', 'bar', 'atm'];
  const extractionSpeedUnit1Options = ['m3', 'L'];
  const extractionSpeedUnit2Options = ['hr', 'min', 's'];
  const pumpTypeOptions = [
    { label: '离子泵', value: 'ion' },
    { label: '分子泵', value: 'turbo' },
    { label: '油泵', value: 'oil' },
    { label: '干泵', value: 'dry' },
    { label: '其他', value: 'other' },
  ]
  // 获取当前激活的法兰
  const activeFlange = computed(() => modelStore.getActiveFlange());

  // 存储所有 watch 停止函数
  const watchStopHandlers: Array<() => void> = [];

  // 监听外部传入的缩放值变化（仅在值变化时更新，避免不必要的更新）
  const stopWatchScale = watch(() => props.modelScaleValue, (newValue) => {
    if (newValue !== undefined && newValue !== null && importModel.modelScale !== newValue) {
      importModel.modelScale = newValue;
    }
  }, { immediate: true });
  watchStopHandlers.push(stopWatchScale);

  // 监听激活法兰的位置和口径变化，同步更新场景中的法兰
  const stopWatchFlangeProps = watch(
    () => activeFlange.value ? {
      id: activeFlange.value.id,
      dir: activeFlange.value.dir,
      diameter: activeFlange.value.diameter
    } : null,
    (newVal, oldVal) => {
      if (!newVal) return;
      
      if (oldVal && oldVal.id !== newVal.id) {
        return;
      }
      
      // 更新口径
      if (oldVal && oldVal.diameter !== newVal.diameter) {
        emit('flangeUpdated', newVal.id, newVal.diameter);
      }
    },
    { immediate: false }
  );
  watchStopHandlers.push(stopWatchFlangeProps);


  // 组件卸载时清除所有 watch
  onUnmounted(() => {
    watchStopHandlers.forEach(stop => stop());
    watchStopHandlers.length = 0;
  });

  // 处理缩放变化
  const handleScaleChange = (value: number) => {
    importModel.modelScale = value;
    emit('scaleChange', value);
  };
  
  // 添加法兰
  const handleAddInletFlange = () => {
    emit('addFlange','inlet');
  };

  // 添加出气法兰
  const handleAddOutletFlange = () => {
    emit('addFlange','outlet');
  };

  // 删除激活的法兰
  const handleDeleteSelectedFlange = () => {
    emit('deleteSelectedFlange');
  };

  // 添加泵数据行
  const addPumpDataRow = () => {
    modelStore.addPumpDataRow();
  };

  // 删除泵数据行
  const deletePumpDataRow = (id: number) => {
    modelStore.deletePumpDataRow(id);
  };

  // 检查是否已存在进气法兰
  const hasInletFlange = computed(() => {
    return modelStore.importModel.userAddedFlanges.some(f => f.type === 'inlet');
  });

  // 检查是否已存在出气法兰
  const hasOutletFlange = computed(() => {
    return modelStore.importModel.userAddedFlanges.some(f => f.type === 'outlet');
  });

  const closePop = () => {
    modelStore.importVisiable = false
  }

  const submitModel = () => {
    emit('submitModel')
  }
</script>
<template>
  <div class="r_aside_container base-box">
    <img class="close_icon cu" :src="imgUrl.close" @click="closePop">
    <el-tabs v-model="activeTab" class="aside-tabs">
      <!-- 第一个 Tab: 泵数据 -->
      <el-tab-pane label="泵数据" name="pumpData">
        <div class="aside-content base-box">
          <!-- 泵数据名称 -->
          <div class="control-section">
            <div class="section-title f14">泵数据名称</div>
            <el-input
              v-model="importModel.pumpDataName"
              placeholder="请输入泵数据名称"
              style="width: 100%"
            />
          </div>
          <!-- 选择泵类型 -->
          <div class="control-section">
            <div class="section-title f14">泵类型</div>
            <el-select
              v-model="importModel.pumpType"
              style="width: 100%"
              placeholder="请选择泵类型"
            >
              <el-option
                v-for="t in pumpTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </div>
          <!-- 单位选择 -->
          <div class="control-section">
            <div class="section-title f14">压力单位</div>
            <el-select
              v-model="importModel.pressureUnit"
              style="width: 100%"
            >
              <el-option
                v-for="unit in pressureUnitOptions"
                :key="unit"
                :label="unit"
                :value="unit"
              />
            </el-select>
          </div>
          <div class="control-section">
            <div class="section-title f14">抽取速度单位</div>
            <div class="unit-select-group">
              <el-select
                v-model="importModel.speed_unit_v"
                style="flex: 1"
              >
                <el-option
                  v-for="unit in extractionSpeedUnit1Options"
                  :key="unit"
                  :label="unit"
                  :value="unit"
                />
              </el-select>
              <span class="unit-separator f18">/</span>
              <el-select
                v-model="importModel.speed_unit_t"
                style="flex: 1"
              >
                <el-option
                  v-for="unit in extractionSpeedUnit2Options"
                  :key="unit"
                  :label="unit"
                  :value="unit"
                />
              </el-select>
            </div>
          </div>
          <!-- 数据表格 -->
          <div class="control-section">
            <div class="section-title f14">数据表格</div>
            <div class="table-container scrollbar-thin round-sm">
              <table class="pump-data-table f14">
                <thead>
                  <tr>
                    <th class="text-l">压力 (P)</th>
                    <th class="text-l">抽取速度 (S)</th>
                    <th class="text-l">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in importModel.pumpDataRows" :key="row.id">
                    <td>{{ row.pressure }}</td>
                    <td>{{ row.extractionSpeed }}</td>
                    <td>
                      <el-button
                        type="danger"
                        :icon="Delete"
                        size="small"
                        circle
                        @click="deletePumpDataRow(row.id)"
                      />
                    </td>
                  </tr>
                  <tr v-if="importModel.pumpDataRows.length === 0">
                    <td colspan="3" class="empty-tip text-c">暂无数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="add-row-container base-box">
            <div class="number_box flex-ct">
              <el-input-number
                v-model="importModel.newPressure"
                placeholder="压力"
              />
              <el-input-number
                v-model="importModel.newExtractionSpeed"
                placeholder="抽取速度"
              />
            </div>
            <div class="add_btn cu f12 fw-300 round-sm flex-ct" @click="addPumpDataRow">
              <img :src="imgUrl.add_tr">
              添加行
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 第二个 Tab: 模型控制 -->
      <el-tab-pane label="模型控制" name="model">
        <div class="aside-content base-box">
          <!-- 模型大小控制 --> 
          <div class="control-section">
            <div class="section-title f14">模型大小</div>
            <el-input-number
              v-model="importModel.modelScale"
              :min="0.01"
              :max="10"
              :step="0.01"
              :precision="2"
              @change="handleScaleChange"
              style="width: 100%"
            />
          </div>
          <!-- 模型正方向 -->
          <div class="control-section">
            <div class="section-title f14">模型正方向</div>
            <el-select
              v-model="importModel.modelDir"
              placeholder="请选择模型正方向"
              style="width: 100%"
            >
              <el-option
                v-for="item in dirOptions"
                :key="item.label"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <!-- 法兰相对模型位置控制 -->
          <div class="control-section" v-if="activeFlange">
            <div class="section-title f14">法兰位置</div>
            <el-select
              v-model="activeFlange.dir"
              placeholder="请选择法兰相对模型位置"
              style="width: 100%"
            >
              <el-option
                v-for="item in posOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <!-- 法兰控制 -->
          <div class="control-section" v-if="activeFlange">
            <div class="section-title f14">法兰口径</div>
            <el-select
              v-model="activeFlange.diameter"
              placeholder="请选择法兰口径"
              style="width: 100%"
            >
              <el-option
                v-for="item in flangeDiameterOptions"
                :key="item.id"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="control-section">
            <div class="section-title f14">添加法兰</div>
            <div class="flex-sb">
              <div 
                class="add-flange base-box f12 fw-300 cu round-sm flex-ct"
                :class="[hasInletFlange?'added':'']"
                @click="handleAddInletFlange">
                  进气法兰
              </div>
              <div 
                class="add-flange base-box f12 fw-300 cu round-sm flex-ct"
                :class="[hasOutletFlange?'added':'']"
                @click="handleAddOutletFlange">
                  出气法兰
              </div>
              <img class="add-flange-icon" :src="imgUrl.import_icon">
            </div>
          </div>
          <div class="control-section">
            <div 
              class="del-flange base-box f12 fw-300 cu round-sm flex-ct"
              @click="handleDeleteSelectedFlange">
                删除选中法兰
            </div>
          </div>
          <div class="submit-section flex-ct round-sm f18 fw-300 cu" @click="submitModel">
            确定提交
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<style scoped lang="scss">
.r_aside_container {
  width: 100%;
  height: 100%;
  background-color: white;
  .close_icon{
    width: 0.12rem;
    height: 0.12rem;
    position: absolute;
    right: 0.2rem;
    top: 0.2rem;
  }
  .aside-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
    .el-tab-pane{
      height: 100%;
    }
  }
}
.aside-content {
  padding: 0.2rem;
  height: 100%;
  overflow-y: auto;
  .control-section {
    // margin-bottom: 0.3rem;
    padding-bottom: 0.2rem;
    display: flex;
    flex-direction: column;
    color: var(--text-d);

    &:last-child {
      border-bottom: none;
    }

    .section-title {
      height: 0.21rem;
      line-height: 0.21rem;
      font-weight: 300;
      margin-bottom: 0.05rem;
    }

    .unit-select-group {
      display: flex;
      align-items: center;
      gap: 0.1rem;

      .unit-separator {
        color: #606266;
      }
    }

    .table-container {
      max-height: 1.5rem;
      overflow-y: auto;
      border: 1px solid #e4e7ed;

      .pump-data-table {
        width: 100%;
        border-collapse: collapse;

        thead {
          background-color: #f5f7fa;
          position: sticky;
          top: 0;
          z-index: 1;

          th {
            padding: 0.1rem;
            font-weight: 500;
            color: #606266;
            border-bottom: 1px solid #e4e7ed;
          }
        }

        tbody {
          tr {
            &:hover {
              background-color: #f5f7fa;
            }

            td {
              padding: 0.1rem;
              color: #303133;
            }

            .empty-tip {
              color: #909399;
              padding: 0.3rem;
            }
          }
        }
      }
    }
    .active-flange-indicator {
      font-size: 0.12rem;
      color: #409eff;
      font-weight: normal;
      margin-left: 0.1rem;
    }
  }
  .add-row-container {
    position: absolute;
    width: 3.44rem;
    height: 1.1rem;
    bottom: 0;
    left: 0rem;
    display: flex;
    align-items: flex-start;
    gap: 0.1rem;
    padding: 0.1rem 0.1rem;
    box-shadow: 0px -4px 30px 0px #9297A038;
    .number_box{
      width: 2.08rem;
      flex-direction: column;
      .el-input-number{
        width: 100%;
        height: 0.3rem;
        margin-bottom: 0.1rem;
      }
    }
    .add_btn{
      background-color: var(--theme);
      color: white;
      width: 0.7rem;
      height: 0.3rem;
      margin-left: 0.24rem;
      img{
        width: 0.14rem;
        height: 0.14rem;
        margin-right: 0.06rem;
      }
    }
  }
  .submit-section{
    width: 3.02rem;
    height: 0.4rem;
    background-color: var(--theme);
    color: white;
    position: absolute;
    bottom: 0.64rem;
  }
}
.add-flange{
  width: 1.2rem;
  height: 0.3rem;
  border: 1px solid #E3E3E3;
  color: #9FA2A5;
}
.added{
  background-color: var(--theme);
  color: white;
}
.add-flange-icon{
  width: 0.15rem;
  height: 0.15rem;
}
.del-flange{
  width: 2.65rem;
  height: 0.3rem;
  border: 1px solid #E3E3E3;
  color: var(--text-d);
  border: 1px solid var(--theme);
  &:hover{
    background-color: var(--theme);
    color: white;
  }
}
:deep(.el-tabs__nav){
  height: 0.32rem;
}
:deep(.el-tabs__item){
  height: 0.27rem;
  line-height: 0.27rem;
  font-size: 0.18rem;
  font-weight: 300;
  color: var(--text-d);
}
:deep(.el-tabs__item.is-active){
  color: var(--text-t);
  font-weight: 700;
}
:deep(.el-tabs__active-bar){
  width: 100%;
  height: 0.05rem;
  background: url('/public/img/tab_bar.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
:deep(.el-tabs__nav-wrap::after){
  display: none;
}
:deep(.el-tabs__header){
  margin: 0.6rem 0.2rem 0.15rem 0.2rem; 
}
</style>