<script lang="ts" setup>
import { ref , reactive , onMounted , onUnmounted, watch, computed } from 'vue'
import { cloneDeep, debounce } from 'lodash'
import { useProjectStore } from '@/store/project';
import { ElMessage, ElMessageBox } from 'element-plus';
import { chamberBaseOptions } from '@/assets/js/modelBaseInfo'
import { flangeDiameterOptions , gasTypeOptions} from '@/assets/js/projectInfo'
import * as THREE from 'three'
import { Flange } from '@/utils/model-fuc/Flange';
import { Port } from '@/utils/model-fuc/Port';
import { pocApi } from '@/utils/http';
  const emits = defineEmits(['updateChamber','delModel'])
  // const { proxy } = getCurrentInstance() as any
  const activeTab = ref<string | number> ('0')
  
  // const chamberVisiable = ref<boolean> (false)
  // const cvsDom = ref<InstanceType<typeof MiniCanvas> | null>(null)
  // const miniReady = ref<boolean>(false)
  const projectStore = useProjectStore()
  const cTypeActive = ref<string | number> (projectStore?.modelList[0]?.cType?.toString() || "0")
  const falngeDia = ref<number>(0.016)
  let chamberForm = reactive<any>({})

  const showOutletBox = ref<boolean>(false)
  const outletOffset = ref<number[]>([0,0])
  watch(() => projectStore.activeFlange,() => {
    if(projectStore.activeClass.type == 'Chamber'){
      console.log(projectStore.activeFlange)
      showOutletBox.value = projectStore.activeClass.activeFace?.children.length > 0
      outletOffset.value = projectStore.activeFlange.offset ?? [0,0]
    }
  })
  onMounted(() => {
    chamberForm = reactive(cloneDeep(chamberBaseOptions))
  })
  
  // 组件卸载时取消防抖，确保资源正确释放
  onUnmounted(() => {
    debouncedUpdateRotation.cancel()
  })
  const handleTypeChange = (val: string | number) => {
    chamberForm = reactive(cloneDeep(chamberBaseOptions))
    chamberForm.cType =  val
    emits('updateChamber',chamberForm)
    // initChamberModel(val)
    // resetInput()
  }

  const changeOutletPos = () => {
    console.log(projectStore.activeClass.activeFlange)
    // let offset = projectStore.activeClass.activeFlange.offset
    let flange:Flange = projectStore.activeClass.activeFlange.flange
    let min_x = 0
    let min_y = 0
    
    let max_x = 0, max_y = 0;
    let faceName = flange.getObject3D().parent!.name
    if(cTypeActive.value == '0'){ //长方体
      min_x = flange.params.drawDiameter/2+flange.params.thickness+projectStore.activeClass.params.thickness;
      min_y = flange.params.drawDiameter/2+flange.params.thickness+projectStore.activeClass.params.thickness;
      switch (faceName){
        case 'front':
        case 'back':
          max_x = projectStore.activeClass.params.width - min_x
          max_y = projectStore.activeClass.params.height - min_y
          break;
        case 'top':
        case 'bottom':
          max_x = projectStore.activeClass.params.length - min_x
          max_y = projectStore.activeClass.params.width - min_y
          break;
        case 'left':
        case 'right':
          max_x = projectStore.activeClass.params.length - min_x
          max_y = projectStore.activeClass.params.height - min_y
          break;
      }

    }else if (cTypeActive.value == '1'){ // 圆柱体
      let offset = flange.params.drawDiameter/2+projectStore.activeClass.params.thickness+flange.params.thickness
      min_x = 0
      min_y = offset
      max_x = projectStore.activeClass.params.diameter/2-offset
      max_y = projectStore.activeClass.params.height-offset
    }else if(cTypeActive.value == '2'){
      let offset = flange.params.drawDiameter/2+projectStore.activeClass.params.thickness+flange.params.thickness
      min_x = 0
      max_x = 0
      max_x = projectStore.activeClass.params.diameter/2-offset
      max_y = projectStore.activeClass.params.height-offset
    }
    min_x = Math.round(min_x * 100) / 100
    min_y = Math.round(min_y * 100) / 100
    max_x = Math.round(max_x * 100) / 100
    max_y = Math.round(max_y * 100) / 100
    console.log(min_x,min_y,max_x,max_y)
    outletOffset.value[0] = outletOffset.value[0] < min_x ? min_x : outletOffset.value[0]
    outletOffset.value[0] = outletOffset.value[0] > max_x ? max_x : outletOffset.value[0]
    outletOffset.value[1] = outletOffset.value[1] < min_y ? min_y : outletOffset.value[1]
    outletOffset.value[1] = outletOffset.value[1] > max_y ? max_y : outletOffset.value[1]
    projectStore.activeClass.setOutletOffset(
      Number(outletOffset.value[0]),
      Number(outletOffset.value[1])
    )
  }
  
  const changePipeLen = (e:any) => {
    console.log(Number(e))
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return
    }
    if(e < 0.15){
      ElMessage.error('Pipe length must be greater than 0.15')
      return
    }
    let s = e / projectStore.activeClass.baseLength
    projectStore.activeClass.setLength(s)
    // projectStore.activeClass.baseLength = e
  }
  const changeBendLen = (e:any) => {
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return
    }
    projectStore.activeClass.setBendAngle(e)
  }
  const changeBranchDia = (e:any) => {
    console.log(e)
    if(!validFuc(e)) return
    
    projectStore.activeClass.setBranchDiameter(e)
  }
  const validFuc = (e:any) => {
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return false
    }
    if(e < 0){
      ElMessage.error('Diameter must be greater than 0')
      return false
    }
    return true
    // if( e > projectStore.activeClass.params.mainDiameter ){
    //   proxy?.$message.show('Branch Diameter must be less than Main Diameter','error')
    //   return false
    // }
  }
  const createFlang = () => {
    projectStore.activeClass.addOutletModel({
      drawDiameter: falngeDia.value,
      actualDiameter: falngeDia.value,
    })
    outletOffset.value = projectStore.activeClass.activeFlange?.offset 
    showOutletBox.value = true
  }
  const delFlange = () => {
    ElMessageBox({
      title: '提示',
      message: '确定要删除吗？',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => { 
      projectStore.activeClass.delFlange()
    })
  }
  const changeReducerDia = () => {
    console.log(projectStore.activeClass.params.innerEnd)
    projectStore.activeClass.updateInnerEnd(projectStore.activeClass.params.innerEnd)
  }
  
  // 获取当前模型的旋转角度（度数）- 基于初始四元数计算相对旋转
  // 将旋转映射到局部坐标系，提取绕指定局部轴的旋转角度
  const getRotationAngle = (activeClass: any) => {
    if (!activeClass) return 0
    
    const group = activeClass.getObject3D()
    if (!group) return 0
    const axis = activeClass.rotateAxis
    
    // 如果没有初始四元数，说明模型还未连接，返回0
    if (!activeClass._initQuat) {
      return 0
    }
    
    // 确保矩阵是最新的
    group.updateMatrixWorld(true)
    
    // 获取当前四元数（这是世界坐标系下的旋转）
    const currentQuat = group.quaternion.clone()
    
    // 关键：将当前旋转转换到初始旋转的局部坐标系中
    const initQuatInv = activeClass._initQuat.clone().invert()
    const localCurrentQuat = initQuatInv.multiply(currentQuat)
    
    // 从局部坐标系中的相对旋转四元数转换为欧拉角
    const euler = new THREE.Euler()
    euler.setFromQuaternion(localCurrentQuat, group.rotation.order)
    
    // 根据 rotateAxis 获取对应的旋转角度（这是局部坐标系下的角度）
    let angleRad = 0
    if (axis === 'X') {
      angleRad = euler.x
    } else if (axis === 'Y') {
      angleRad = euler.y
    } else if (axis === 'Z') {
      angleRad = euler.z
    }
    
    // 转换为度数并四舍五入到两位小数
    return Math.round((angleRad * 180 / Math.PI) * 100) / 100
  }
  
  // 实际更新旋转角度的函数（基于初始四元数设置目标旋转）
  // 用户输入的角度是相对于初始状态的旋转角度
  const updateRotationAngle = (num: number) => {
    const numValue = Number(num)
    if (isNaN(numValue)) {
      ElMessage.error('请输入数字')
      return
    }
    if (!projectStore.activeClass) return
    const group = projectStore.activeClass.getObject3D()
    if (!group) return
    const axis = projectStore.activeClass.rotateAxis
    
    // 如果没有初始四元数，说明模型还未连接，无法设置旋转
    if (!projectStore.activeClass._initQuat) {
      ElMessage.warning('模型未连接，无法设置旋转角度')
      return
    }
    
    const angleRad = numValue * Math.PI / 180
    
    // 确保矩阵是最新的
    group.updateMatrixWorld(true)
    
    // 创建绕指定轴旋转的四元数（相对旋转）
    const relativeQuat = new THREE.Quaternion()
    if (axis === 'X') {
      relativeQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleRad)
    } else if (axis === 'Y') {
      relativeQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleRad)
    } else if (axis === 'Z') {
      relativeQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angleRad)
    }
    
    // 目标旋转 = 初始旋转 * 相对旋转
    const targetQuat = projectStore.activeClass._initQuat.clone().multiply(relativeQuat)
    
    // 设置目标旋转
    group.quaternion.copy(targetQuat)
    
    // 更新矩阵
    group.updateMatrix()
    group.updateMatrixWorld(true)
    
    // 更新端口位置
    projectStore.activeClass.notifyPortsUpdated()
  }
  
  // 使用防抖包装更新函数，延迟 300ms 执行，避免输入时模型连续变换
  const debouncedUpdateRotation = debounce(updateRotationAngle, 500)
  
  const currentRotationAngle = computed({
    get: () => {
      // 依赖 rotationUpdateKey 和 activeClass 来触发更新
      // 必须直接读取 activeClass 来建立响应式依赖
      const activeClass = projectStore.activeClass
      console.log(activeClass)
      projectStore.rotationUpdateKey // 读取这个值来建立依赖
      if (!activeClass) return 0
      // 传入 activeClass 参数，确保使用最新的 activeClass
      return getRotationAngle(activeClass)
    },
    set: (value: number) => {
      if (!projectStore.activeClass) return
      
      // 调用防抖函数，避免输入时模型连续变换
      debouncedUpdateRotation(value)
    }
  })
  
  const deleteModel = () => {
    ElMessageBox({
      title: '提示',
      message: '确定要删除吗？',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => { 
      emits('delModel')
    })
  }

  // 场景计算
  const startCalculate = async () => {
    try {
      await saveProject()
    } catch (error) {
      // saveProject 中已经显示了错误消息，这里直接返回
      return
    }
    let check = projectStore.checkScene()
    console.log(check)
    if(!check) {
      return
    }
    // let arr:any = []
    await pocApi.calcPoc(projectStore.projectInfo).then((_res) => {
      ElMessage.success('计算成功')
    }).catch(err => console.error(err))
  }
  // 保存场景
  const saveProject = async () => {
    try {
      let arr:any = []
      projectStore.modelList.forEach((item:any) => {
        // let modelData = cloneDeep(item)
        let portList = item.portList.map((p:Port) => {
          return {
            ...p,
            connected: p.connected ? p.connected.id : null,
            parent: p.parent.id
          }
        })
        let flangeList = cloneDeep(item.flanges)
        const obj = {
          type: item.type ?? '',
          params: item.params,
          id: item.id,
          portList: portList,
          flangeList: flangeList.map((f:any) => {
            f.flange.mesh = undefined;
            f.flange.port = undefined
            return f
          }),
          rotateAxis: item.rotateAxis ? item.rotateAxis : '',
          rotate:item.getObject3D().rotation.toArray(),
        }
        arr.push(obj)
      })
      console.log(arr)
      projectStore.projectInfo.modelList = arr
      let project_json = JSON.stringify(arr)
      // console.log(projectStore.modelList)
      await pocApi.updatePocById({
        id: projectStore.projectInfo.id,
        user : projectStore.projectInfo.user,
        project_name: projectStore.projectInfo.name,
        project_json
      }).then((_res) => {
        ElMessage.success('保存成功')
      }).catch((err: any) => {
        console.error(err)
        ElMessage.error(err?.errmsg || err?.message || '保存失败，请重试')
        throw err // 抛出错误，让调用者知道保存失败
      })
    } catch (error: any) {
      // 处理非 API 调用产生的其他错误
      if (error && !error.errmsg && !error.message) {
        ElMessage.error('保存失败，请重试')
      }
      throw error // 重新抛出错误
    }
  }
</script>
<template>
  <div class="r_aside_container base-box">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="数据" name="0">
        <div class="f20">基础数据</div>
        <template v-if="projectStore.activeClass?.type == 'Chamber'">
          <el-tabs v-model="cTypeActive" @tab-change="handleTypeChange">
            <el-tab-pane label="长方体" name="0" :disabled="projectStore.modelList.length > 1">
              <div class="input_box flex-sb">
                <div class="label f18">长</div>
                <el-input 
                  v-model="chamberForm.length" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">宽</div>
                <el-input 
                  v-model="chamberForm.width" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">高</div>
                <el-input 
                  v-model="chamberForm.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f16 fB">当前选中面</div>
              <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div>
              <el-select v-model="falngeDia" value-key="id">
                <el-option
                  v-for="item in flangeDiameterOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              
              <el-button class="f16" @click="createFlang">添加法兰口</el-button>
              <el-button 
                class="f16" 
                @click="delFlange" 
                v-if="projectStore.activeClass.activeFlange 
                && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
              >
                删除法兰口
              </el-button>
              <div v-if="showOutletBox">
                <div class="f16 fB">法兰口设置</div>
                <div class="input_box flex-sb ">
                  <div class="label f18" >X-offset</div>
                  <el-input 
                    v-model="outletOffset[0]" 
                    placeholder="请输入"
                    @change="changeOutletPos"/>
                </div>
                <div class="input_box flex-sb f18">
                  <div class="label f18">Y-offset</div>
                  <el-input
                    v-model="outletOffset[1]" 
                    placeholder="请输入" 
                    @change="changeOutletPos"/>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="圆柱体" name="1" :disabled="projectStore.modelList.length > 1">
              <div class="input_box flex-sb">
                <div class="label f18">直径</div>
                <el-input 
                  v-model="chamberForm.diameter" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">高度</div>
                <el-input 
                  v-model="chamberForm.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f16 fB">当前选中面</div>
              <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div>

              <el-select v-model="falngeDia" value-key="id">
                <el-option
                  v-for="item in flangeDiameterOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              
              <el-button class="f16" @click="createFlang">添加法兰口</el-button>
              <el-button 
                class="f16" 
                @click="delFlange" 
                v-if="projectStore.activeClass.activeFlange 
                && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
              >
                删除法兰口
              </el-button>
              <div v-if="showOutletBox">
                <div class="f16 fB">法兰口设置</div>
                <div class="input_box flex-sb" v-if="projectStore.activeClass.activeFace.name == 'side'">
                  <div class="label f18" >H-offset</div>
                    <el-input 
                      v-model="outletOffset[1]" 
                      placeholder="请输入"
                      @change="changeOutletPos"/>
                </div>
                <div class="input_box flex-sb f18" v-else>
                  <div class="label f18">R-offset</div>
                  <el-input
                    v-model="outletOffset[0]" 
                    placeholder="请输入" 
                    @change="changeOutletPos"/>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="胶囊" name="2" :disabled="projectStore.modelList.length > 1">
              <div class="input_box flex-sb">
                <div class="label f18">直径</div>
                <el-input 
                  v-model="chamberForm.diameter" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">高度</div>
                <el-input 
                  v-model="chamberForm.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f16 fB">当前选中面</div>
              <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div>

              <el-select v-model="falngeDia" value-key="id">
                <el-option
                  v-for="item in flangeDiameterOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              
              <el-button class="f16" @click="createFlang">添加法兰口</el-button>
              <el-button 
                class="f16" 
                @click="delFlange" 
                v-if="projectStore.activeClass.activeFlange 
                && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
              >
                删除法兰口
              </el-button>
              <div v-if="showOutletBox">
                <div class="f16 fB">法兰口设置</div>
                <div class="input_box flex-sb f18" v-if="projectStore.activeClass.activeFace.name == 'side'">
                  <div class="label f18">H-offset</div>
                  <el-input
                    v-model="outletOffset[1]" 
                    placeholder="请输入" 
                    @change="changeOutletPos"/>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Pipe'">
          <div class="f24">类型:直管</div>
          <div class="length f20">
            长度 
          </div>
          <el-input v-model="projectStore.activeClass.newLength" @change="changePipeLen">
          </el-input>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Bend'">
          <div class="f24">类型:弯管</div>
          <div class="flex-sb model_info">
            <div class="length f18">弯曲角度</div>
            <el-input v-model="projectStore.activeClass.params.bendAngleDeg" @change="changeBendLen"></el-input>
          </div>
          
          <div class="flex-sb model_info">
            <div class="length f18">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Tee'">
          <div class="f24">类型:三通</div>
          <div class="flex-sb model_info">
            <div class="length f20">分支管径</div>
            <el-select v-model="projectStore.activeClass.params.branchDiameter" value-key="id" @change="changeBranchDia">
              <el-option
                v-for="item in flangeDiameterOptions"
                :key="item.id"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          
          <div class="flex-sb model_info">
            <div class="length f18">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Reducer'">
          <div class="f24">类型:异径管</div>
          <div class="length f20">
            出气口管径
          </div>
          <el-input v-model="projectStore.activeClass.params.innerEnd" @change="changeReducerDia"></el-input>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Cross'">
          <div class="f24">类型:四通管</div>
          <div class="flex-sb model_info">
            <div class="length f20">分支管径</div>
            <el-select v-model="projectStore.activeClass.params.innerBranch" value-key="id" @change="changeBranchDia">
              <el-option
                v-for="item in flangeDiameterOptions"
                :key="item.id"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="flex-sb model_info">
            <div class="length f18">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'LTube'">
          <div class="f24">类型:直角斜切管</div>
          <div class="flex-sb model_info">
            <div class="length f18">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Valve'">
          <div class="f24">类型:阀门</div>
          <div class="flex-sb model_info">
            <div class="length f18">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
        </template>
        <el-button style="margin-top: 0.2rem;" @click="deleteModel" v-if="projectStore.activeClass?.type !== 'Chamber'">
          删除模型
        </el-button>
      </el-tab-pane>
      <el-tab-pane label="模拟" name="1">
        <el-select v-model="projectStore.projectInfo.gasType" value-key="id">
          <el-option
            v-for="item in gasTypeOptions"
            :key="item.id"
            :label="item.title"
            :value="item.value"
          />
        </el-select>
        <el-button @click="startCalculate">calculate</el-button>
      </el-tab-pane>
      <el-tab-pane label="设置" name="2">设置</el-tab-pane>
    </el-tabs>
    <div class="save_btn">
      <el-button @click="saveProject">保存场景</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.r_aside_container{
  height: 100%;
  padding: 0 0.1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.input_box{
  width: 100%;
  height: 0.4rem;
  .label{
    width: 1.5rem;
  }
}
.chamber_form{
  width: 100%;
  height: 100%;
  background-color: white;
  .header{
    height: 0.55rem;
    padding: 0 0.2rem;
    border-bottom: 1px solid #E5E5E5;
    img{
      width: 0.2rem;
      height: 0.2rem;
    }
  }
}
.chamber_cont{
  .cnv_box{
    width: calc(100% - 4rem);
    height: 5rem;
    overflow: hidden;
  }
  .chamber_info{
    width: 4rem;
    height: 5rem;
    padding: 0.2rem;
    
  }
  
}
.chamber_btn{
  height: 0.74rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.2rem;
}
.save_btn{
  width: 100%;
  height: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  .el-button{
    width: 100% !important;
  }
}
.model_info{
  .length{
    width: 1rem;
  }
  margin-top: 0.1rem;
}
</style>