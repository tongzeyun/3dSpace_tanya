<script lang="ts" setup>
import { ref , onMounted , onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { debounce } from 'lodash'
import { useProjectStore } from '@/store/project';
import { useUserStore } from '@/store/userInfo';
import { ElMessage, ElMessageBox } from 'element-plus';
import { flangeDiameterOptions , gasTypeOptions} from '@/assets/js/projectInfo'
import * as THREE from 'three'
import { Flange } from '@/utils/model-fuc/Flange';
import { Port } from '@/utils/model-fuc/Port';
import { pocApi } from '@/utils/http';
// import router from '@/router';
  const emits = defineEmits(['updateChamber','delModel'])
  const echartsRef = ref<HTMLElement | null>(null)
  let chart: any = null
  const showChart = ref<boolean>(false)
  // const { proxy } = getCurrentInstance() as any
  const activeTab = ref<string | number> ('0')
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const cTypeActive = ref<string | number> (projectStore?.modelList[0]?.cType?.toString() || "0")
  const falngeDia = ref<number>(0.016)
  const savePopVisiable = ref<boolean>(false)

  const showOutletBox = ref<boolean>(false)
  const outletOffset = ref<number[]>([0,0])
  watch(() => projectStore.activeFlange,() => {
    if(projectStore.activeClass?.type == 'Chamber'){
      // console.log(projectStore.activeFlange)
      showOutletBox.value = projectStore.activeClass.activeFace?.children.length > 0
      outletOffset.value = projectStore.activeFlange?.offset ?? [0,0]
    }
  }, { immediate: false })

  onMounted(() => {
    // console.log(projectStore.modelList)
    // 初始化 ECharts
    const resizeHandler = () => {
      if (chart) chart.resize()
    }
    window.addEventListener('resize', resizeHandler)
    // 保存 resizeHandler 到 ref 以便卸载时移除
    ;(onMounted as any)._resizeHandler = resizeHandler
  })
  
  // 组件卸载时取消防抖，确保资源正确释放
  onUnmounted(() => {
    debouncedUpdateRotation.cancel()
    // 卸载 ECharts
    try {
      const rh = (onMounted as any)._resizeHandler
      if (rh) window.removeEventListener('resize', rh)
    } catch (e) {}
    if (chart) {
      chart.dispose()
      chart = null
    }
  })
  const handleTypeChange = (val: string | number) => {
    if (!projectStore.modelList || projectStore.modelList.length === 0) {
      return
    }
    emits('updateChamber',{cType:val})
  }

  const changeOutletPos = () => {
    if (!projectStore.activeClass || !projectStore.activeClass.activeFlange || !projectStore.activeClass.activeFlange.flange) {
      return
    }
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
    if (!projectStore.activeClass) {
      return
    }
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
    if (!projectStore.activeClass) {
      return
    }
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return
    }
    projectStore.activeClass.setBendAngle(e)
  }
  const changeBranchDia = (e:any) => {
    if (!projectStore.activeClass) {
      return
    }
    // console.log(e)
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
  }
  const createFlang = () => {
    if (!projectStore.activeClass) {
      return
    }
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
      if (projectStore.activeClass) {
        projectStore.activeClass.delFlange()
      }
    })
  }
  const changeReducerDia = () => {
    if (!projectStore.activeClass || !projectStore.activeClass.params) {
      return
    }
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
    // console.log('euler',euler)
    // 根据 rotateAxis 获取对应的旋转角度（这是局部坐标系下的角度）
    let angleRad = 0
    if (axis === 'X') {
      angleRad = euler.x
    } else if (axis === 'Y') {
      angleRad = euler.y
    } else if (axis === 'Z') {
      angleRad = euler.z
    }
    // console.log('angleRad',angleRad)
    // 转换为度数并四舍五入到两位小数
    return Math.round((angleRad * 180 / Math.PI) * 100) / 100
  }
  
  // 实际更新旋转角度的函数
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
    group.updateMatrix(true)
    group.updateMatrixWorld(true)
    
    // 更新端口位置
    projectStore.activeClass.notifyPortsUpdated()
    projectStore.isSubmit = false
    // console.log(projectStore.activeClass)
  }
  
  // 使用防抖包装更新函数，延迟 300ms 执行，避免输入时模型连续变换
  const debouncedUpdateRotation = debounce(updateRotationAngle, 500)

  // 当保存弹层确认后需要执行的后续动作（例如保存后继续计算）
  const pendingAction = ref<string | null>(null)
  
  const currentRotationAngle = computed({
    get: () => {
      // 依赖 rotationUpdateKey 和 activeClass 来触发更新
      // 必须直接读取 activeClass 来建立响应式依赖
      const activeClass = projectStore.activeClass
      // console.log(activeClass)
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

  const processSceneData = () => {
    let arr: any[] = []
    console.log(projectStore.modelList)
    let modelList = [...projectStore.modelList]
    modelList.forEach((item:any) => {
      // let modelData = cloneDeep(item)
      let group = item.getObject3D()
      group.updateMatrixWorld(true)
      let portList = item.portList.map((p:Port) => {
        return {
          ...p,
          connected: p.connected ? p.connected.id : null,
          parent: p.parent.id
        }
      })
      let flangeList = item.flanges.map((f:any) => {
        // console.log("f===>", f);
        let obj = {
          offset:f.offset,
          flange: {
            id: f.flange.id,
            params: f.flange.params,
          }
        }
        return obj
      })
      // let flangeList = cloneDeep(item.flanges)
      const obj = {
        type: item.type ?? '',
        params: item.params,
        id: item.id,
        portList: portList,
        flangeList: flangeList,
        rotateAxis: item.rotateAxis ? item.rotateAxis : '',
        rotate:group.rotation.toArray(),
      }
      // 清空obj.params过期的数据
      if(obj.params){
        delete obj.params.flangeList
        delete obj.params.portList
      }
      arr.push(obj)
    })
    return arr
  }

  // 场景计算
  const startCalculate = async () => {
    let check = projectStore.checkScene()
    console.log(check)
    if(!check) {
      return
    }
    let arr:any = processSceneData()
    // let arr:any = []
    console.log(projectStore.projectInfo)
    let obj = {
      id: projectStore.projectInfo.id,
      project_name: projectStore.projectInfo.name,
      model_data: arr
    }
    await pocApi.calcPoc(obj).then((res) => {
      ElMessage.success('计算成功')
      projectStore.projectInfo.calcData = res as any
      try {
        showChart.value = true
        renderChart(res)
      } catch (e) {
        console.error(e)
      }
    }).catch(err => {
      // console.error(err)
      ElMessage.error(err?.errmsg || err?.message || '计算失败')
    })
  }

  // 渲染图表的函数，调用时传入后端返回的数据
  const renderChart = (val: any) => {
    if (!echartsRef.value) return
    if (!val || !val.time || !val.pressure) {
      chart.clear()
      showChart.value = false
      return
    }
    // console.log(echartsRef.value)
    chart = echarts.init(echartsRef.value)
    const timeData = Array.isArray(val.time) ? val.time : []
    const pressureData = Array.isArray(val.pressure) ? val.pressure : []

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: function (params: any) {
          const p = params && params[0]
          if (!p) return ''
          const axisVal = p.axisValue
          const valY = p.data
          return `time: ${axisVal}<br/>pressure: ${valY}`
        }
      },
      xAxis: {
        type: 'category',
        name: 'time',
        data: timeData,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: 'pressure'
      },
      series: [
        {
          name: 'pressure',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          data: pressureData,
          lineStyle: { width: 2 },
          areaStyle: {}
        }
      ],
      grid: { left: '8%', right: '4%', bottom: '10%' }
    }

    chart.setOption(option)
  }

  // 保存场景
  const saveProject = async () => {
    try {
      let arr:any = processSceneData()
      if(!arr) {
        return
      }
      console.log(arr)
      projectStore.projectInfo.modelList = arr
      // let model_data = arr
      // console.log(projectStore.modelList)
      console.log(projectStore.projectInfo.id)
      if(projectStore.projectInfo.id){
        await updateProject(arr)
      }else{
        await createProject(arr)
      }
      
    } catch (error: any) {
      projectStore.loading = false
      // 处理非 API 调用产生的其他错误
      if (error && !error.errmsg && !error.message) {
        ElMessage.error('保存失败，请重试')
      }
      throw error // 重新抛出错误
    }
  }

  const onConfirmSave = async () => {
    try {
      projectStore.loading = true
      savePopVisiable.value = false
      // console.log('保存项目')
      await saveProject()
      if (pendingAction.value === 'calculate') {
        pendingAction.value = null
        // 保存成功后继续执行计算
        await startCalculate()
      }
    } catch (err) {
      projectStore.loading = false;
      pendingAction.value = null
    }
  }

  // 新增场景
  const createProject = async (model_data:any) => {
    try {
      if(!userStore.userInfo.id){
        throw new Error('请先登录')
      }
      if(!projectStore.projectInfo.name){
        throw new Error('请输入场景名称')
      }
      await pocApi.createPoc({
        user : userStore.userInfo.id,
        project_name: projectStore.projectInfo.name,
        model_data
      }).then((res:any) => {
        let isSuccess = projectStore.setProjectInfo(res)
        if(isSuccess) {
          ElMessage.success('创建成功')
        }else {
          ElMessage.error('创建失败，请重试')
        }
      }).catch((err: any) => {
        console.error(err)
        ElMessage.error(err?.errmsg || err?.message)
      }).finally(() =>{  
        projectStore.loading = false;
        projectStore.isSubmit = true
      })
    }catch (error) {
      console.error(error)
      projectStore.loading = false;
      return
    }
  }

  // 修改场景
  const updateProject = async (model_data:any) => {
    try {
      await pocApi.updatePocById({
        id: projectStore.projectInfo.id,
        user : userStore.userInfo.id,
        project_name: projectStore.projectInfo.name,
        model_data
      }).then((res) => {
        let isSuccess = projectStore.setProjectInfo(res)
        if(isSuccess) {
          ElMessage.success('保存成功')
        }else {
          ElMessage.error('保存失败，请重试')
        }
      }).catch((err: any) => {
        console.error(err)
        ElMessage.error(err?.errmsg || err?.message || '保存失败，请重试')
        throw err 
      }).finally(() => { 
        projectStore.loading = false;
        projectStore.isSubmit = true
      });
    } catch (error) {
      return
    }
  }

  const clickBtn = (type: string) => {
    console.log(projectStore.isSubmit)
    if (type == 'submit') {
      pendingAction.value = null
      savePopVisiable.value = true
    } else {
      if (projectStore.isSubmit) {
        startCalculate()
      } else {
        pendingAction.value = 'calculate'
        savePopVisiable.value = true
      }
    }
  }
  const changeVolume = () => {
    if (!projectStore.modelList || projectStore.modelList.length === 0 || !projectStore.modelList[0]?.params) {
      return
    }
    let num = projectStore.modelList[0].params.volume
    let type = projectStore.modelList[0].params.cType
    if(type == '0'){
      let cubeRoot = Math.floor(Math.cbrt(num) * 1000) / 1000;
      projectStore.modelList[0].params.length = 
      projectStore.modelList[0].params.width = 
      projectStore.modelList[0].params.height = cubeRoot
    }else{
      let cubeRoot = Math.cbrt((4 * num) / Math.PI)
      cubeRoot = Math.floor(cubeRoot * 1000) / 1000
      projectStore.modelList[0].params.height = 
      projectStore.modelList[0].params.diameter = cubeRoot
    }
    emits('updateChamber',projectStore.modelList[0].params)
  }
</script>
<template>
  <div class="r_aside_container base-box">
    <div class="top flex-fe">
      <div class="f12">帮助</div>
      <div class="f12">语言</div>
    </div>
    <el-tabs v-model="activeTab" class="tabs_box">
      <el-tab-pane label="数据" name="0">
        <template v-if="projectStore.activeClass?.type === 'Chamber' && projectStore.modelList && projectStore.modelList.length > 0">
          <el-tabs class="sub_tabs" v-model="cTypeActive" @tab-change="handleTypeChange">
            <el-tab-pane label="长方体" name="0" :disabled="projectStore.modelList.length > 1">
              <div class="input_box">
                <div class="label f14">体积</div>
                <el-input
                  v-model="projectStore.modelList[0].params.volume" 
                  placeholder="请输入" 
                  @change="changeVolume" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box ">
                <div class="label f14">长</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.length" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box ">
                <div class="label f14">宽</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.width" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box">
                <div class="label f14">高</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <!-- <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div> -->
              <div class="f_dec f12 fw-300">提示：请选中您需要操作的面</div>
              <div class="f_tit f16 fw-700">法兰口设置</div>
              <div class="f_info f14">口径</div>
              <div class="input_box">
                <el-select v-model="falngeDia" value-key="id">
                  <el-option
                    v-for="item in flangeDiameterOptions"
                    :key="item.id"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
              <div class="f_info f14">位置</div>
              <div class="input_box" v-if="showOutletBox">
                <div class="label f14" >X-offset</div>
                <el-input 
                  v-model="outletOffset[0]" 
                  placeholder="请输入"
                  @change="changeOutletPos"/>
              </div>
              <div class="input_box" v-if="showOutletBox">
                <div class="label f14" >X-offset</div>
                <el-input
                  v-model="outletOffset[1]" 
                  placeholder="请输入" 
                  @change="changeOutletPos"/>
              </div>
              
              <div class="flex-sb">
                <el-button class="f16" @click="createFlang">添加法兰口</el-button>
                <el-button type="danger" class="f16" 
                  @click="delFlange" 
                  v-if="projectStore.activeClass.activeFlange 
                  && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
                > 删除法兰口</el-button>
              </div>
            </el-tab-pane>
            <el-tab-pane label="圆柱体" name="1" :disabled="projectStore.modelList.length > 1">
              <div class="input_box">
                <div class="label f14">体积</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.volume" 
                  placeholder="请输入体积" 
                  @change="changeVolume" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box">
                <div class="label f14">直径</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.diameter" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box">
                <div class="label f14">高度</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f_dec f12 fw-300">提示：请选中您需要操作的面</div>
              <div class="f_tit f16 fw-700">法兰口设置</div>
              <div class="f_info f14">口径</div>
              <div class="input_box">
                <el-select v-model="falngeDia" value-key="id">
                  <el-option
                    v-for="item in flangeDiameterOptions"
                    :key="item.id"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
              <div class="f_info f14">位置</div>
              <div class="input_box" v-if="projectStore.activeClass.activeFace?.name == 'side'">
                <div class="label f14" >H-offset</div>
                <el-input 
                  v-model="outletOffset[1]" 
                  placeholder="请输入"
                  @change="changeOutletPos"/>
              </div>
              <div class="input_box f14" v-else>
                <div class="label f14">R-offset</div>
                <el-input
                  v-model="outletOffset[0]" 
                  placeholder="请输入" 
                  @change="changeOutletPos"/>
              </div>
              <div class="flex-sb">
                <el-button class="f16" @click="createFlang">添加法兰口</el-button>
                <el-button 
                  class="f16" 
                  type="danger"
                  @click="delFlange" 
                  v-if="projectStore.activeClass.activeFlange 
                  && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
                >
                  删除法兰口
                </el-button>
              </div>
            </el-tab-pane>
            <el-tab-pane label="胶囊" name="2" :disabled="projectStore.modelList.length > 1">
              <div class="input_box">
                <div class="label f14">体积</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.volume" 
                  placeholder="请输入" 
                  @change="changeVolume" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box">
                <div class="label f14">直径</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.diameter" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box">
                <div class="label f14">高度</div>
                <el-input 
                  v-model="projectStore.modelList[0].params.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',projectStore.modelList[0].params)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f_dec f12 fw-300">提示：请选中您需要操作的面</div>
              <div class="f_tit f16 fw-700">法兰口设置</div>
              <div class="f_info f14">口径</div>

              <div class="input_box">
                <el-select v-model="falngeDia" value-key="id">
                  <el-option
                    v-for="item in flangeDiameterOptions"
                    :key="item.id"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
              <div class="f_info f14" v-if="projectStore.activeClass.activeFace?.name == 'side'">位置</div>
              <div class="input_box" v-if="projectStore.activeClass.activeFace?.name == 'side'">
                <div class="label f14">H-offset</div>
                <el-input
                  v-model="outletOffset[1]" 
                  placeholder="请输入" 
                  @change="changeOutletPos"/>
              </div>
              <div class="flex-sb">
                <el-button class="f16" @click="createFlang">添加法兰口</el-button>
                <el-button 
                  class="f16" 
                  @click="delFlange" 
                  type="danger"
                  v-if="projectStore.activeClass.activeFlange 
                  && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
                >删除法兰口</el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Pipe'">
          <div class="f16 fw-700 cus_tit">直管</div>
          <div class="input_box">
            <div class="label f14">长度</div>
            <el-input v-model="projectStore.activeClass.newLength" @change="changePipeLen">
            </el-input>
          </div>
          <div class="input_box">
            <div class="label f14">内径</div>
            <el-input v-model="projectStore.activeClass.params.diameter" disabled>
            </el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Bend'">
          <div class="f16 fw-700 cus_tit">弯管</div>
          <div class="input_box">
            <div class="label f14">弯曲角度</div>
            <el-input v-model="projectStore.activeClass.params.bendAngleDeg" @change="changeBendLen">
            </el-input>
          </div>
          <div class="input_box">
            <div class="label f14">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
          <div class="input_box">
            <div class="label f14">内径</div>
            <el-input v-model="projectStore.activeClass.params.diameter" disabled>
            </el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Tee'">
          <div class="f16 fw-700 cus_tit">三通</div>
          <div class="input_box">
            <div class="label f14">分支管径</div>
            <el-select v-model="projectStore.activeClass.params.branchDiameter" value-key="id" @change="changeBranchDia">
              <el-option
                v-for="item in flangeDiameterOptions"
                :key="item.id"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="input_box">
            <div class="label f14">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
          <div class="input_box">
            <div class="label f14">内径</div>
            <el-input v-model="projectStore.activeClass.params.diameter" disabled>
            </el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Reducer'">
          <div class="f16 fw-700 cus_tit">异径管</div>
          <div class="input_box">
            <div class="label f14">出气口管径</div>
            <el-select v-model="projectStore.activeClass.params.innerEnd" value-key="id" @change="changeReducerDia">
              <el-option
                v-for="item in flangeDiameterOptions"
                :key="item.id"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="input_box">
            <div class="label f14">进气口管径</div>
            <el-input v-model="projectStore.activeClass.params.diameter" disabled>
            </el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Cross'">
          <div class="f16 fw-700 cus_tit">四通管</div>
          <div class="input_box">
            <div class="label f14">分支管径</div>
            <el-select v-model="projectStore.activeClass.params.innerBranch" value-key="id" @change="changeBranchDia">
              <el-option
                v-for="item in flangeDiameterOptions"
                :key="item.id"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="input_box">
            <div class="label f14">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
          <div class="input_box">
            <div class="label f14">内径</div>
            <el-input v-model="projectStore.activeClass.params.diameter" disabled>
            </el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'LTube'">
          <div class="f16 fw-700 cus_tit">直角斜切管</div>
          <div class="input_box">
            <div class="label f14">旋转角度</div>
            <el-input v-model.number="currentRotationAngle"></el-input>
          </div>
          <div class="input_box">
            <div class="label f14">内径</div>
            <el-input v-model="projectStore.activeClass.params.diameter" disabled>
            </el-input>
          </div>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Valve'">
          <div class="f16 fw-700 cus_tit">阀门</div>
          <div class="input_box">
            <div class="label f14">旋转角度</div>
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
        <el-button color="#FF7777" @click="clickBtn('calculate')" plain style="margin-top: 0.3rem;">模拟计算</el-button>
        <div class="echars_box" ref="echartsRef" v-show="showChart" style="width: 4.5rem;height:3rem;">
        </div>
      </el-tab-pane>
    </el-tabs>
    <div class="save_btn">
      <el-button color="#5B9BFF" @click="clickBtn('submit')" plain>保存场景</el-button>
    </div>
  </div>
  <el-dialog v-model="savePopVisiable"  width="8.4rem">
    <div class="pop_tit fw-700 f36">保存项目</div>
    <div class="input_tit f24 fw-300">请为您的项目命名</div>
    <el-input v-model="projectStore.projectInfo.name"></el-input>
    <template #footer>
      <div class="pop_fot flex-fe">
        <div class="base-box text-c round-sm f32 fw-300 cu" @click="savePopVisiable = false">取消</div>
        <div class="base-box text-c round-sm f32 fw-300 cu" @click="onConfirmSave">完成</div>
      </div>
    </template>
  </el-dialog>
</template>
<style lang="scss" scoped>
.r_aside_container{
  height: 100%;
  padding: 0 0.1rem;
  justify-content: space-between;
  box-shadow: -19px 0px 24.6px 0px #696D720F;
  padding: 0.42rem 0.4rem 0 0.4rem;
  .top{
    color: var(--text-d);
    div{
      margin-left: 0.22rem;
    }
  }
  .tabs_box{
    margin-top: 0.4rem;
  }
}
.input_box{
  width: 100%;
  margin-bottom: 0.15rem;
  .label{
    color: var(--text-d);
    height: 0.21rem;
    line-height: 0.21rem;
  }
}
.el-input,.el-select {
  display: block;
}
:deep(.el-input__wrapper){
  width: 100%;
  box-sizing: border-box;
}
.f_dec{
  color: rgba(255, 119, 119, 0.45);
}
.f_tit{
  margin: 0.32rem 0 0.24rem 0;
}
.f_info{
  height: 0.21rem;
  line-height: 0.21rem;
  margin-bottom: 0.05rem;
}
.cus_tit{
  margin-bottom: 0.24rem;
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
:deep(.tabs_box .el-tabs__content){
  height: 8rem;
  overflow-y: auto;
}
:deep(.el-tabs__nav-wrap::after){
  display: none;
}
:deep(.el-tabs__header){
  margin-bottom: 0.32rem;
}
:deep(.sub_tabs .el-tabs__active-bar){
  display: none;
}
:deep(.sub_tabs .el-tabs__item.is-active){
  color: var(--theme);
  font-weight: 700;
  font-size: 0.14rem;
}
:deep(.sub_tabs .el-tabs__item){
  height: 0.21rem;
  line-height: 0.21rem;
  font-size: 0.14rem;
  font-weight: 300;
  color: var(--text-d);
}
:deep(.sub_tabs .el-tabs__header){
  margin-bottom: 0.24rem;
}
:deep(.sub_tabs .el-tabs__content){
  height: 100%;
  // overflow-y: auto;
}
.chamber_btn{
  height: 0.74rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.2rem;
}
.save_btn{
  width: 3.2rem;
  height: 0.42rem;
  position: absolute;
  left: 0.4rem;
  bottom: 0.65rem;
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
.pop_tit{
  color: var(--text-t);
  margin-bottom: 0.45rem;
  height: 0.55rem;
  height: 0.55rem;
}
.input_tit{
  height: 0.36rem;
  line-height: 0.36rem;
  margin-bottom: 0.1rem;
}
.pop_fot{
  div{
    margin-left: 0.25rem;
  }
  div:nth-of-type(1){
    width: 1.6rem;
    border: 1px solid #E3E3E3;
    color: var(--text-d);
  }
  div:nth-of-type(2){
    width: 2.7rem;
    background-color: var(--theme);
    color: white;
  }
}
</style>