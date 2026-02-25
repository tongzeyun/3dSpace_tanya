import { defineStore } from 'pinia';
import { ref } from 'vue';
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
  const addClass = (cls:any) => {
    modelList.value.push(cls)
    modelList.value.forEach((item:any) => {
      item.setUnseleteState()
    })
    cls.setSeleteState()
    activeClass.value = cls
    isSubmit.value = false
    findParallelPort()
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

  // 寻找可以并联的法兰口
  const findParallelPort = () => {
    let fList = [] as any // 存储所有法兰口的列表
    modelList.value.forEach((item:any) => {
      if(item.flanges && item.flanges.length > 0) {
        fList.push(...item.flanges.map((item:any) => item.flange))
      }
    })
    // console.log('pList',pList)
    // 寻找可以并联的法兰口（满足条件：未连接、端口中心相距不超过规定阈值）
    const parallelPorts = [] as any
    const threshold = 0.01 // 阈值，单位与模型坐标一致
    fList.forEach((f:Flange) => {
      let p = f.port
      if(p && !p.isConnected) {
        f.getObject3D().updateMatrixWorld(true) // 确保矩阵更新
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
      
      // 使用已存储的法兰对象，获取端口父级的世界矩阵（矩阵已在前面更新过）
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
          // 对于方向向量，应该只应用旋转部分，不应用平移
          // 方法1: 使用quaternion（推荐，更清晰）
          const quaternion = new THREE.Quaternion()
          group.getWorldQuaternion(quaternion)
          const worldAxis = localAxis.clone().applyQuaternion(quaternion).normalize()
          // 方法2: 从matrixWorld提取旋转矩阵（备选方案）
          // const rotationMatrix = new THREE.Matrix4()
          // rotationMatrix.extractRotation(group.matrixWorld)
          // const worldAxis = localAxis.clone().applyMatrix4(rotationMatrix).normalize()
          console.log('worldAxis',worldAxis)
          // 定义场景的标准轴方向
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