<script lang="ts" setup>
import { ref, watch, computed, onUnmounted } from 'vue';
import { flangeDiameterOptions } from '@/assets/js/projectInfo';
import { Delete, Plus } from '@element-plus/icons-vue';
import { useModelStore } from '@/store/model';

  // 定义 props，用于接收外部传入的缩放值
  const props = defineProps<{
    modelScaleValue?: number;
  }>();

  // 定义事件
  const emit = defineEmits<{
    scaleChange: [scale: number];
    addInletFlange: [];
    addOutletFlange: [];
    deleteSelectedFlange: [];
    flangeUpdated: [id: number, field: 'position' | 'diameter', value: string | number];
  }>();

  // 使用 store
  const modelStore = useModelStore();

  // 从 store 获取导入模型相关状态（使用 reactive，保持响应式）
  const importModel = modelStore.importModel;

  // 法兰位置选项
  const dirOptions = [
    { label: '+X' , value: '+X' },
    { label: '-X' , value: '-X' },
    { label: '+Y' , value: '+Y' },
    { label: '-Y' , value: '-Y' },
    { label: '+Z' , value: '+Z' },
    { label: '-Z' , value: '-Z' },
  ]

  // Tab 激活状态
  const activeTab = ref('model');

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
      position: activeFlange.value.position,
      diameter: activeFlange.value.diameter
    } : null,
    (newVal, oldVal) => {
      if (!newVal) return;
      
      // 如果是切换了激活的法兰（oldVal 存在但 id 不同），不触发更新
      if (oldVal && oldVal.id !== newVal.id) {
        return;
      }
      
      // 更新位置
      if (oldVal && oldVal.position !== newVal.position) {
        emit('flangeUpdated', newVal.id, 'position', newVal.position);
      }
      
      // 更新口径
      if (oldVal && oldVal.diameter !== newVal.diameter) {
        emit('flangeUpdated', newVal.id, 'diameter', newVal.diameter);
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
  
  // 添加进气法兰
  const handleAddInletFlange = () => {
    emit('addInletFlange');
  };

  // 添加出气法兰
  const handleAddOutletFlange = () => {
    emit('addOutletFlange');
  };

  // 删除激活的法兰
  const handleDeleteSelectedFlange = () => {
    emit('deleteSelectedFlange');
  };

  // 添加泵数据行（使用 store 的方法）
  const addPumpDataRow = () => {
    modelStore.addPumpDataRow();
  };

  // 删除泵数据行（使用 store 的方法）
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

</script>
<template>
  <div class="r_aside_container base-box">
    <el-tabs v-model="activeTab" class="aside-tabs">
      <!-- 第一个 Tab: 模型控制 -->
      <el-tab-pane label="模型控制" name="model">
        <div class="aside-content base-box">
          <!-- 模型大小控制 -->
          <div class="control-section">
            <div class="section-title f16">模型大小</div>
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
            <div class="section-title f16">模型正方向</div>
            <el-select
              v-model="importModel.modelDir"
              placeholder="请选择模型正方向"
              style="width: 100%"
            >
              <el-option
                v-for="item in dirOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <!-- 法兰相对模型位置控制 -->
          <div class="control-section" v-if="activeFlange">
            <div class="section-title f16">
              法兰位置
              <!-- <span v-if="activeFlange" class="active-flange-indicator">
                (当前: {{ getFlangeTypeText(activeFlange.type) }} - {{ activeFlange.position }})
              </span> -->
            </div>
            <el-select
              v-model="activeFlange.position"
              placeholder="请选择法兰相对模型位置"
              style="width: 100%"
            >
              <el-option
                v-for="item in dirOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <!-- 法兰控制 -->
          <div class="control-section" v-if="activeFlange">
            <div class="section-title f16" >
              法兰口径
              <!-- <span v-if="activeFlange" class="active-flange-indicator">
                (当前: {{ getFlangeDiameterText(activeFlange.diameter) }})
              </span> -->
            </div>
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
            <div class="section-title f16">添加法兰</div>
            <el-button
              type="success"
              @click="handleAddInletFlange"
              :disabled="hasInletFlange"
              style="width: 100%; margin-bottom: 0.2rem"
            >
              {{ hasInletFlange ? '已添加进气法兰' : '添加进气法兰' }}
            </el-button>
            <el-button
              type="danger"
              @click="handleAddOutletFlange"
              :disabled="hasOutletFlange"
              style="width: 100%; margin-bottom: 0.2rem"
            >
              {{ hasOutletFlange ? '已添加出气法兰' : '添加出气法兰' }}
            </el-button>
            <el-button
              type="warning"
              @click="handleDeleteSelectedFlange"
              style="width: 100%"
            >
              删除选中法兰
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 第二个 Tab: 泵数据 -->
      <el-tab-pane label="泵数据" name="pumpData">
        <div class="aside-content base-box">
          <!-- 泵数据名称 -->
          <div class="control-section">
            <div class="section-title f16">泵数据名称</div>
            <el-input
              v-model="importModel.pumpDataName"
              placeholder="请输入泵数据名称"
              style="width: 100%"
            />
          </div>
          <!-- 选择泵类型 -->
          <div class="control-section">
            <div class="section-title f16">泵类型</div>
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
            <div class="section-title f16">压力单位</div>
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
            <div class="section-title f16">抽取速度单位</div>
            <div class="unit-select-group">
              <el-select
                v-model="importModel.extractionSpeedUnit1"
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
                v-model="importModel.extractionSpeedUnit2"
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
            <div class="section-title f16">数据表格</div>
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

          <!-- 添加新行 -->
          <div class="control-section">
            <div class="section-title f16">添加数据</div>
            <div class="add-row-container">
              <el-input-number
                v-model="importModel.newPressure"
                placeholder="压力"
                :precision="2"
                style="flex: 1; margin-right: 0.1rem"
              />
              <el-input-number
                v-model="importModel.newExtractionSpeed"
                placeholder="抽取速度"
                :precision="2"
                style="flex: 1; margin-right: 0.1rem"
              />
              <el-button
                type="primary"
                :icon="Plus"
                @click="addPumpDataRow"
              >
                添加行
              </el-button>
            </div>
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
  display: flex;
  flex-direction: column;

  .aside-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__content) {
      flex: 1;
      overflow-y: auto;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  .aside-content {
    padding: 0.2rem;
    height: 100%;

    .control-section {
      margin-bottom: 0.3rem;
      padding-bottom: 0.3rem;
      display: flex;
      flex-direction: column;

      border-bottom: 1px solid #e4e7ed;

      &:last-child {
        border-bottom: none;
      }

      .section-title {
        margin-bottom: 0.15rem;
        font-weight: 500;
        color: #303133;
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
        max-height: 4rem;
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
              border-bottom: 1px solid #e4e7ed;

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

      .add-row-container {
        display: flex;
        align-items: center;
        gap: 0.1rem;
      }

      .active-flange-indicator {
        font-size: 0.12rem;
        color: #409eff;
        font-weight: normal;
        margin-left: 0.1rem;
      }
    }
  }
}
.el-button{
  margin: 0;
}
</style>