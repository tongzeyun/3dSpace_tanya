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
  const mergeablePairs = shallowRef<any[]>([])
  // 需要从场景移除的合并组及其子模型信息（解除合并后需要处理）
  const unmergedGroups = shallowRef<Array<{mergedGroup: THREE.Group, groupA: THREE.Group, groupB: THREE.Group}>>([])
  // 已合并的模型列表（用于快速查找和检查已合并的模型）
  const mergedModels = shallowRef<Array<{
    modelA: any,
    modelB: any,
    portA: any,
    portB: any,
  }>>([])
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

  // 检查两个端口是否满足并联条件（提取的公共函数）
  const checkPortsParallel = (portA: any, portB: any, threshold: number = 0.01) => {
    // 使用 toRaw 确保获取原始对象
    const rawPortA = toRaw(portA)
    const rawPortB = toRaw(portB)
    
    // 获取端口父级对象
    const parentObjA = toRaw(rawPortA.parent.getObject3D())
    const parentObjB = toRaw(rawPortB.parent.getObject3D())
    
    // 更新世界矩阵
    parentObjA.updateMatrixWorld(true)
    parentObjB.updateMatrixWorld(true)
    
    const parentMatrixA = parentObjA.matrixWorld
    const parentMatrixB = parentObjB.matrixWorld
    
    // 计算端口A的世界位置和方向
    const worldPosA = rawPortA.localPos.clone().applyMatrix4(parentMatrixA)
    const rotationMatrixA = new THREE.Matrix4().extractRotation(parentMatrixA)
    const worldDirA = rawPortA.localDir.clone().applyMatrix4(rotationMatrixA).normalize()
    
    // 计算端口B的世界位置和方向
    const worldPosB = rawPortB.localPos.clone().applyMatrix4(parentMatrixB)
    const rotationMatrixB = new THREE.Matrix4().extractRotation(parentMatrixB)
    const worldDirB = rawPortB.localDir.clone().applyMatrix4(rotationMatrixB).normalize()
    
    // 计算两个端口之间的距离
    const distance = worldPosA.distanceTo(worldPosB)
    
    // 计算方向点积
    const dotProduct = worldDirA.dot(worldDirB)
    console.log('dotProduct',dotProduct,distance)
    // 判断是否满足并联条件：方向相反（点积 < -0.8）且距离很近（distance < threshold * 0.5）
    const isParallel = dotProduct < -0.8 && distance < threshold * 0.5
    
    return {
      isParallel,
      distance,
      dotProduct,
      worldPosA,
      worldPosB,
      worldDirA,
      worldDirB
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
      
      for (let j = i + 1; j < parallelPorts.length; j++) {
        const itemB = parallelPorts[j]
        const { flange: flangeB, port: portB } = itemB
        
        // 使用提取的公共函数检查是否满足并联条件
        const checkResult = checkPortsParallel(portA, portB, threshold)
        
        if (checkResult.isParallel) {
          console.log('dotProduct', checkResult.dotProduct)
          parallelPairs.push({
            portA: portA,
            portB: portB,
            flangeA: flangeA,
            flangeB: flangeB,
            distance: checkResult.distance,
            posA: checkResult.worldPosA,
            posB: checkResult.worldPosB,
            dirA: checkResult.worldDirA,
            dirB: checkResult.worldDirB
          })
        }
      }
    }
    console.log('parallelPairs',parallelPairs)
    return parallelPairs
  }

  // 取消合并
  const unmergeModelsByModels = (modelA: any, modelB: any) => {
    const rawA = toRaw(modelA)
    const rawB = toRaw(modelB)
    const groupA = toRaw(rawA.getObject3D())
    const groupB = toRaw(rawB.getObject3D())

    // 恢复父元素的变换控制
    if (groupA.userData) {
      groupA.userData.isTransform = groupA.userData._originalIsTransform ?? false
      groupA.userData.isRotation = groupA.userData._originalIsRotation ?? false
      delete groupA.userData.isMerged
    }
    if (groupB.userData) {
      groupB.userData.isTransform = groupB.userData._originalIsTransform ?? false
      groupB.userData.isRotation = groupB.userData._originalIsRotation ?? false
      delete groupB.userData.isMerged
    }

    // 断开端口连接
    if (rawA && rawB) {
      // 找到对应的端口并断开连接
      modelA.portList?.forEach((port: any) => {
        if (port.isMerged) {
          // port.connected = null
          port.isConnected = false
          port.isMerged = false
        }
      })
      modelB.portList?.forEach((port: any) => {
        if (port.isMerged) {
          // port.connected = null
          port.isConnected = false
          port.isMerged = false
        }
      })
    }

    // 从已合并模型数组中移除这一对合并对
    const index = mergedModels.value.findIndex(item => 
      (item.modelA === rawA && item.modelB === rawB) || 
      (item.modelA === rawB && item.modelB === rawA)
    )
    if (index > -1) {
      mergedModels.value.splice(index, 1)
    }

    return { groupA, groupB }
  }


  // 检查并标记可合并的模型
  const checkMergeableModels = () => {
    const pairs = findParallelPort()
    mergeablePairs.value = pairs || []

    // 直接遍历已合并的模型数组，检查是否还满足并联条件
    for (let i = mergedModels.value.length - 1; i >= 0; i--) {
      const mergedItem = mergedModels.value[i]
      const { modelA, modelB } = mergedItem
      
      // 验证模型是否仍然有效
      if (!modelA || !modelB) {
        // 如果模型已失效，从数组中移除
        mergedModels.value.splice(i, 1)
        continue
      }

      // 使用保存的端口信息检查连接状态
      const { portA, portB } = mergedItem
      // console.log('portA',portA,portB)
      if(!portA || !portB || !portA.isConnected || !portB.isConnected) {
        console.log('已合并的模型端口未连接，解除合并', modelA.id, modelB.id)
        unmergeModelsByModels(modelA, modelB)
        console.log('已解除合并')
        continue
      }

      // 使用提取的公共函数检查是否还满足并联条件
      const threshold = 0.01 // 与 findParallelPort 使用相同的阈值
      const checkResult = checkPortsParallel(portA, portB, threshold)
      
      if (!checkResult.isParallel) {
        // 不满足并联条件，解除合并
        console.log('已合并的端口不再满足并联条件，解除合并', {
          distance: checkResult.distance,
          dotProduct: checkResult.dotProduct,
          modelA: modelA.id,
          modelB: modelB.id
        })
        
        // 调用解除合并函数
        unmergeModelsByModels(modelA, modelB)
        console.log('已解除合并')
        // unmergeModelsByModels 已经从 mergedModels 中移除了该项，所以这里不需要再移除
      } else {
        console.log('已合并的端口仍然满足并联条件', {
          distance: checkResult.distance,
          dotProduct: checkResult.dotProduct,
          modelA: modelA.id,
          modelB: modelB.id
        })
      }
    }
  }

  // 获取当前选中模型所属的可合并对
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
  const mergeParallelModels = (modelA: any, modelB: any, portA?: any, portB?: any) => {
    // 使用 toRaw 确保获取原始 Three.js 对象，避免 Vue Proxy 导致 modelViewMatrix 等只读属性报错
    const rawA = toRaw(modelA)
    const rawB = toRaw(modelB)
    const groupA = toRaw(rawA.getObject3D())
    const groupB = toRaw(rawB.getObject3D())
    
    // 检查是否已经合并过
    const existingMerge = mergedModels.value.find(item => 
      (item.modelA === rawA && item.modelB === rawB) || 
      (item.modelA === rawB && item.modelB === rawA)
    )
    if (existingMerge) {
      console.log('模型已经合并过，先取消合并')
      unmergeModelsByModels(rawA, rawB)
    }

    // 保存原始变换设置，然后禁用父元素的变换控制
    if (groupA.userData) {
      groupA.userData._originalIsTransform = groupA.userData.isTransform ?? false
      groupA.userData._originalIsRotation = groupA.userData.isRotation ?? false
      groupA.userData.isTransform = false
      groupA.userData.isRotation = false
      groupA.userData.isMerged = true // 添加合并标记
    }
    if (groupB.userData) {
      groupB.userData._originalIsTransform = groupB.userData.isTransform ?? false
      groupB.userData._originalIsRotation = groupB.userData.isRotation ?? false
      groupB.userData.isTransform = false
      groupB.userData.isRotation = false
      groupB.userData.isMerged = true // 添加合并标记
    }

    // 连接端口（如果提供了端口）
    if (portA && portB) {
      portA.isConnected = true
      portA.isMerged = true
      portB.isConnected = true
      portB.isMerged = true
    }

    // 将合并信息添加到已合并模型数组
    mergedModels.value.push({
      modelA: rawA,
      modelB: rawB,
      portA: portA,
      portB: portB
    })

    console.log('合并模型完成', { modelA: rawA.id, modelB: rawB.id })
    return {
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
    mergedModels.value = []
    unmergedGroups.value = []
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
    // unmergeModels,
    unmergedGroups,
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