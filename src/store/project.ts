import { defineStore } from 'pinia';
import { ref, shallowRef, toRaw } from 'vue';
// import { menuData } from '@/assets/js/projectInfo';
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
import { Flange } from '@/utils/model-fuc/Flange';
// import { chamberBaseOptions , pipeBaseOptions , bendBaseOptions } from '@/assets/js/modelBaseInfo';
export const useProjectStore = defineStore( 'project', () => {

  const projectInfo = ref({
    name: '',
    id: '',
    user: '', // 项目所属用户
    gasType: 'air', // 气体类型
    temperature: 20, // 环境温度
    humidity: 40, // 环境湿度
    storageTime: '大于一周', // 存储时间
    preDisposal: '无', // 前置破空方式
    seal:'橡胶', // 密封方式
    modelList:[],
    calcData:{},
    pocSize:{
      length: 0,
      width: 0,
      height: 0,
    },
  })
  const isSubmit = ref<boolean>(false) // 是否已保存
  const modelList = ref([] as any) // 场景中的模型列表
  const activeClass = ref(null as any) // 当前选中场景对象
  const activeFlange = ref(null as any) // 当前选中法兰对象
  const menuPos = ref<{x:number,y:number}>({x:0,y:0}) //当前菜单位置
  const menuVisiable = ref<boolean>(false) // 菜单是否显示
  // const menuList = ref<any[]>(menuData) // 菜单列表数据
  const rotationUpdateKey = ref<number>(0) // 用于触发旋转角度显示更新的键
  const loading = ref<boolean>(false)
  // 可合并的法兰口对（每次缩放/变换后更新，用于标记可合并的模型）
  // 使用 shallowRef 避免 Vue 深度代理 Three.js 对象导致 modelViewMatrix 等只读属性报错
  const mergeablePairs = shallowRef<any[]>([])
  const addClass = (cls:any) => {
    modelList.value.push(cls)
    modelList.value.forEach((item:any) => {
      item.setUnseleteState()
    })
    cls.setSeleteState()
    activeClass.value = cls
    isSubmit.value = false
    checkMergeableModels()
  }
  const findCurClass = (id: string) => {
    try{
      if(id.length == 0 || !modelList.value){
        throw new Error('id is null')
      }
      // console.log(id)
      // const curGroup = modelList.value.find((item: any) => item.getObject3D().uuid == id)
      // console.log(curGroup)
      modelList.value.forEach((item:any) => {
        item.setUnseleteState()
        if(item.getObject3D().uuid == id) {
          activeClass.value = item
        }
      })
    }catch(err){
      console.error('findCurGroup err===>',err)
    }
  }

  // 查询可以并联的法兰口
  const findParallelPort = () => {
    let fList = [] as any // 存储所有法兰口的列表
    modelList.value.forEach((item:any) => {
      if(item.flanges && item.flanges.length > 0) {
        fList.push(...item.flanges.map((item:any) => item.flange))
      }
    })
    // console.log('pList',pList)
    // 寻找可以并联的法兰口（满足条件：未连接;端口中心相距不超过规定阈值）
    const parallelPorts = [] as any
    const threshold = 0.01 // 阈值
    fList.forEach((f:Flange) => {
      let p = f.port
      if(p && !p.isConnected) {
        f.getObject3D().updateMatrixWorld(true)
        let fPos = new THREE.Vector3().setFromMatrixPosition(f.getObject3D().matrixWorld)
        parallelPorts.push({
          port: p,
          pos: fPos,
          flange: f,
        })
      }
    })
    console.log('parallelPorts',parallelPorts)
    // 寻找距离在阈值范围内的法兰口对
    const parallelPairs = [] as any
    
    // 遍历所有未连接的法兰口对，找出满足并联条件的对
    for (let i = 0; i < parallelPorts.length; i++) {
      const itemA = parallelPorts[i]
      const { flange: flangeA, port: portA } = itemA
      
      const parentObjA = portA.parent.getObject3D()
      const parentMatrixA = parentObjA.matrixWorld
      
      // 计算端口A的世界位置和方向
      const worldPosA = portA.localPos.clone().applyMatrix4(parentMatrixA)
      const rotationMatrixA = new THREE.Matrix4().extractRotation(parentMatrixA)
      const worldDirA = portA.localDir.clone().applyMatrix4(rotationMatrixA).normalize()
      
      for (let j = i + 1; j < parallelPorts.length; j++) {
        const itemB = parallelPorts[j]
        const { flange: flangeB, port: portB } = itemB
        
        // 使用已存储的法兰对象，获取端口父级的世界矩阵
        const parentObjB = portB.parent.getObject3D()
        const parentMatrixB = parentObjB.matrixWorld
        
        // 计算端口B的世界位置和方向
        const worldPosB = portB.localPos.clone().applyMatrix4(parentMatrixB)
        const rotationMatrixB = new THREE.Matrix4().extractRotation(parentMatrixB)
        const worldDirB = portB.localDir.clone().applyMatrix4(rotationMatrixB).normalize()
        
        // 计算两个端口之间的距离
        const distance = worldPosA.distanceTo(worldPosB)
        
        // 检查距离是否在阈值范围内
        if (distance <= threshold) {
          // 计算方向是否相反（两个法兰口应该面对面）
          // 计算方向点积，如果接近-1，说明两个方向相反（面对面）
          const dotProduct = worldDirA.dot(worldDirB)
          console.log('dotProduct',dotProduct)
          // 如果方向相反（点积接近-1）或者距离非常近，认为是并联对
          // 使用阈值0.8，允许一定的角度误差
          if (dotProduct < -0.8 && distance < threshold * 0.5) {
            parallelPairs.push({
              portA: portA,
              portB: portB,
              flangeA: flangeA,
              flangeB: flangeB,
              distance: distance,
              posA: worldPosA,
              posB: worldPosB,
              dirA: worldDirA,
              dirB: worldDirB
            })
          }
        }
      }
    }
    console.log('parallelPairs',parallelPairs)
    return parallelPairs
  }

  // 检查并标记可合并的模型（缩放/变换后调用）
  const checkMergeableModels = () => {
    const pairs = findParallelPort()
    mergeablePairs.value = pairs || []
  }

  // 获取当前选中模型所属的可合并对（如果有）
  const getMergeablePairForModel = (model: any) => {
    if (!model || !mergeablePairs.value.length) return null
    const modelId = model.id
    const modelUuid = model.getObject3D?.()?.uuid
    return mergeablePairs.value.find((pair: any) => {
      const idA = pair.portA?.parent?.id
      const idB = pair.portB?.parent?.id
      const uuidA = pair.portA?.parent?.getObject3D?.()?.uuid
      const uuidB = pair.portB?.parent?.getObject3D?.()?.uuid
      return (modelId && (modelId === idA || modelId === idB)) ||
        (modelUuid && (modelUuid === uuidA || modelUuid === uuidB))
    }) || null
  }

  // 合并可以并联的法兰口的父元件
  const mergeParallelModels = (modelA: any, modelB: any) => {
    // 使用 toRaw 确保获取原始 Three.js 对象，避免 Vue Proxy 导致 modelViewMatrix 等只读属性报错
    const rawA = toRaw(modelA)
    const rawB = toRaw(modelB)
    const groupA = toRaw(rawA.getObject3D())
    const groupB = toRaw(rawB.getObject3D())
    
    // 如果已经在同一个父组中，说明已经合并过
    if (groupA.parent === groupB.parent && groupA.parent?.name === 'AuxScene') {
      console.log('模型已经合并过')
      return null
    }

    // 更新世界矩阵
    groupA.updateMatrixWorld(true)
    groupB.updateMatrixWorld(true)

    // 保存两个模型的世界变换
    const worldMatrixA = groupA.matrixWorld.clone()
    const worldMatrixB = groupB.matrixWorld.clone()

    // 创建新的合并组
    const mergedGroup = new THREE.Group()
    mergedGroup.name = 'AuxScene'
    mergedGroup.userData = {
      isRoot: true,
      isTransform: false,
      isRotation: false,
      isMerged: true, // 标记为合并组
      mergedModels: [rawA.id, rawB.id] // 记录合并的模型ID
    }

    // 将两个模型添加到合并组中
    // 如果模型已经有父级，需要先移除
    if (groupA.parent) {
      groupA.parent.remove(groupA)
    }
    if (groupB.parent) {
      groupB.parent.remove(groupB)
    }

    // 添加到合并组
    mergedGroup.add(groupA)
    mergedGroup.add(groupB)

    // 计算合并组的中心位置（两个模型中心的中点）
    const centerA = new THREE.Vector3().setFromMatrixPosition(worldMatrixA)
    const centerB = new THREE.Vector3().setFromMatrixPosition(worldMatrixB)
    const mergedCenter = centerA.clone().add(centerB).multiplyScalar(0.5)

    // 设置合并组的位置
    mergedGroup.position.copy(mergedCenter)

    // 将模型A和B的位置调整为相对于合并组的局部坐标
    const localPosA = centerA.clone().sub(mergedCenter)
    const localPosB = centerB.clone().sub(mergedCenter)
    
    groupA.position.copy(localPosA)
    groupB.position.copy(localPosB)

    // 保持原有的旋转和缩放
    const rotationA = new THREE.Euler().setFromRotationMatrix(
      new THREE.Matrix4().extractRotation(worldMatrixA)
    )
    const rotationB = new THREE.Euler().setFromRotationMatrix(
      new THREE.Matrix4().extractRotation(worldMatrixB)
    )
    groupA.rotation.copy(rotationA)
    groupB.rotation.copy(rotationB)

    // 禁用子模型的独立变换
    if (groupA.userData) {
      groupA.userData.isTransform = false
      groupA.userData.isRotation = false
      groupA.userData.isMergedChild = true // 标记为合并的子模型
    }
    if (groupB.userData) {
      groupB.userData.isTransform = false
      groupB.userData.isRotation = false
      groupB.userData.isMergedChild = true // 标记为合并的子模型
    }

    // 更新矩阵
    mergedGroup.updateMatrixWorld(true)

    console.log('合并模型完成', mergedGroup)
    return {
      mergedGroup,
      modelA: rawA,
      modelB: rawB
    }
  }

  // const setActiveFlange = (id:string) => {
  //   activeFlange.value = activeClass.value.findFlange(id)
  // }

  // 校验场景是否合法
  const checkScene = () => {
    let flag = true
    modelList.value.forEach((item:any) => {
      // 检查端口是否封闭
      // item.portList.forEach((port:any) => {
      //   if(!port.isConnected && item.type !== 'Valve' && item.type !== 'Pump'){
      //     flag = false
      //   }
      // })
      // if(!flag) {
      //   ElMessage.error('有端口未封闭')
      // }
      // 检查泵的朝向
      if(item.type == 'Pump'){
        const dir = item.params.modelDir // '+Z', '+X', '-Y' 等
        console.log('dir',dir)
        if(dir) {
          const group = item.getObject3D()
          if(!group) {
            ElMessage.error(`泵 ${item.id} 模型对象不存在`)
            flag = false
            return
          }
          
          // 更新世界矩阵
          group.updateMatrixWorld(true)
          
          // 解析方向字符串，例如 '+Z' -> {axis: 'Z', sign: 1}
          const dirMatch = dir.match(/^([+-]?)([XYZ])$/)
          if(!dirMatch) {
            ElMessage.error(`泵 ${item.id} 的朝向配置无效: ${dir}`)
            flag = false
            return
          }
          
          const sign = dirMatch[1] === '-' ? -1 : 1
          const axis = dirMatch[2] // 'X', 'Y', 或 'Z'
          
          // 定义局部坐标系的轴向量（单位向量）
          let localAxis = new THREE.Vector3()
          if(axis === 'X') {
            localAxis.set(sign, 0, 0)
          } else if(axis === 'Y') {
            localAxis.set(0, sign, 0)
          } else if(axis === 'Z') {
            localAxis.set(0, 0, sign)
          }
          // localAxis.multiplyScalar(sign)
          console.log('localAxis',localAxis)
          // 将局部轴向量转换到世界坐标系
          const quaternion = new THREE.Quaternion()
          group.getWorldQuaternion(quaternion)
          const worldAxis = localAxis.clone().applyQuaternion(quaternion).normalize()
          console.log('worldAxis',worldAxis)
          // 定义标准轴方向
          let sceneAxis = new THREE.Vector3(0,1,0)
          
          console.log('sceneAxis',sceneAxis)
          // 计算两个向量的点积，如果接近1说明方向一致
          const dot = worldAxis.dot(sceneAxis)
          // 使用阈值判断（考虑到浮点数误差，使用0.99作为阈值，即角度误差约8度）
          if(dot < 0.99) {
            ElMessage.error(`泵 ${item.id} 的朝向不正确，期望方向为 ${dir}，但实际方向与场景${axis}轴不一致`)
            flag = false
          }
        }
      }
    })
    return flag
  }

  const clearModelList = () => {
    // 重置 store 中的相关状态
    // modelList.value = []
    modelList.value.length = 0
    activeClass.value = null
    activeFlange.value = null
    mergeablePairs.value = []
    projectInfo.value.id = ''
    projectInfo.value.name = ''
    projectInfo.value.user = ''
    projectInfo.value.gasType = 'air'
    projectInfo.value.modelList = []
    projectInfo.value.calcData = []
    isSubmit.value = false
    loading.value = false
    // menuList.value = menuData
    menuVisiable.value = false
    menuPos.value = { x: 0, y: 0 }
    rotationUpdateKey.value = 0
    // console.log('clearModelList', modelList.value)
  }

  const setProjectInfo = (info:any) => {
    if(!info || !info.id){
      console.error('projectInfo or projectInfo ID is null')
      return false
    }
    projectInfo.value.gasType = info.gas_type || 'air'
    projectInfo.value.id = info.id
    projectInfo.value.name = info.project_name || ''
    projectInfo.value.modelList = info.model_data || []
    return true
  }
  
  return {
    projectInfo,
    modelList,
    activeClass,
    menuPos,
    menuVisiable,
    // menuList,
    activeFlange,
    rotationUpdateKey,
    isSubmit,
    loading,
    findCurClass,
    addClass,
    checkScene,
    clearModelList,
    setProjectInfo,
    findParallelPort,
    mergeParallelModels,
    checkMergeableModels,
    mergeablePairs,
    getMergeablePairForModel,
  }
}
,{
  persist: {
    key: 'project',
    pick: ['projectInfo'],
    storage: sessionStorage
  }
}
)