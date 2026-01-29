import { defineStore } from 'pinia';
import { ref } from 'vue';
// import { menuData } from '@/assets/js/projectInfo';
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
// import { chamberBaseOptions , pipeBaseOptions , bendBaseOptions } from '@/assets/js/modelBaseInfo';
export const useProjectStore = defineStore( 'project', () => {

  const projectInfo = ref({
    name: '',
    id: '',
    user: '', // 项目所属用户
    gasType: 'air', // 气体类型
    modelList:[],
    calcData:[],
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