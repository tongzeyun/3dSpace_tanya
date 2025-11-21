import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProjectStore = defineStore( 'project', () => {
  // 直管基础参数
  const pipeBaseOptions = ref({
    type: 'Pipe',
    name: 'Pipe',
    length:1,
    diameter: 0.1,
    thickness: 0.01,
    rotation: {x: 0, y: 0, z:0},
    scale: {x: 1, y: 1, z: 1},
    position: {x: 0, y: 0, z: 0},
    initClass: {},
    isTransform: true,
    isRotation: false,
    inOffset:{x: 0, y: 0, z: 0}, // 输入口相对模型中心偏移量
    outOffset:{x: 0, y: 0, z: 0}, // 输出口想多模型中心偏移量
  })
  // 弯管基础参数
  const bendBaseOptions = ref({
    bendAngleDeg: 45,
  })
  const modelList = ref([
    {
      type: 'Chamber',
      name: 'chamber',
      cType: '0',
      width: 1,
      height: 1,
      length: 1,
      radius: 1,
      thickness: 0.05,
      rotation: {x: 0, y: 0, z: 0},
      scale: {x: 1, y: 1, z: 1},
      position: {x: 0, y: 0, z: 0},
      hole_location_x: 0.5, 
      hole_location_y: 0.5, 
      hole_location_h: 0.5, 
      hole_location_r: 0.5,
      faceIndex: '5',
      initClass: {},
      isTransform: false,
      isRotation: false,
    }
  ] as any)
  const activeGroup = ref(null as any) // 当前选中场景对象
  const menuPos = ref<{x:number,y:number}>({x:0,y:0}) //当前菜单位置
  const menuVisiable = ref<boolean>(false)
  const findCurGroup = (id: number) => {
    if(id < 0 || !modelList.value){
      throw new Error('id is null')
    }
    console.log(id)
    const curGroup = modelList.value.find((item: any) => item.id === id)
    console.log(curGroup)
    if (!curGroup) {
      throw new Error('Cannot find model with id ' + id)
    }
    // return curGroup
    curGroup.initClass.setSeleteState()
    activeGroup.value = curGroup
  }
  return {
    modelList,
    activeGroup,
    menuPos,
    menuVisiable,
    pipeBaseOptions,
    findCurGroup
  }
})