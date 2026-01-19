import { defineStore } from 'pinia';
import { ref } from 'vue';
import { menuData } from '@/assets/js/projectInfo';
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
// import { chamberBaseOptions , pipeBaseOptions , bendBaseOptions } from '@/assets/js/modelBaseInfo';
export const useProjectStore = defineStore( 'project', () => {

  const projectInfo = ref({
    name: '',
    id: '',
    user: '', // 项目所属用户
    gasType: 'air', // 气体类型
    modelList:[]
  })
  const modelList = ref([] as any)
  const activeClass = ref(null as any) // 当前选中场景对象
  const activeFlange = ref(null as any) // 当前选中法兰对象
  const menuPos = ref<{x:number,y:number}>({x:0,y:0}) //当前菜单位置
  const menuVisiable = ref<boolean>(false)
  const menuList = ref<any[]>(menuData)
  const rotationUpdateKey = ref<number>(0) // 用于触发旋转角度显示更新的键
  const addClass = (cls:any) => {
    modelList.value.push(cls)
    modelList.value.forEach((item:any) => {
      item.setUnseleteState()
    })
    cls.setSeleteState()
    activeClass.value = cls
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
      item.portList.forEach((port:any) => {
        if(!port.isConnected && item.type !== 'Valve' && item.type !== 'Pump'){
          ElMessage.error('有端口未封闭')
          flag = false
        }
      })
      
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
            localAxis.set(1, 0, 0)
          } else if(axis === 'Y') {
            localAxis.set(0, 1, 0)
          } else if(axis === 'Z') {
            localAxis.set(0, 0, 1)
          }
          localAxis.multiplyScalar(sign)
          
          // 将局部轴向量转换到世界坐标系
          // 使用 matrixWorld 的旋转部分（对于方向向量，平移部分不影响方向）
          const worldAxis = localAxis.clone().applyMatrix4(group.matrixWorld).normalize()
          
          // 定义场景的标准轴方向
          let sceneAxis = new THREE.Vector3()
          if(axis === 'X') {
            sceneAxis.set(sign, 0, 0)
          } else if(axis === 'Y') {
            sceneAxis.set(0, sign, 0)
          } else if(axis === 'Z') {
            sceneAxis.set(0, 0, sign)
          }
          
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
  
  return {
    projectInfo,
    modelList,
    activeClass,
    menuPos,
    menuVisiable,
    menuList,
    activeFlange,
    rotationUpdateKey,
    findCurClass,
    addClass,
    checkScene,
  }
}, {
  persist: {
    key: 'project',
    pick: ['projectInfo'],
    storage: sessionStorage
  }
})