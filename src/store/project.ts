import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProjectStore = defineStore( 'project', () => {
  const modelList = ref([
    {
      id:0,
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
    },
    {
      id:1,
      type: 'Pipe',
      name: 'Pipe',
      length:1,
      diameter: 0.1,
      thickness: 0.01,
      rotation: {x: 0, y: 0, z: -Math.PI / 2},
      scale: {x: 1, y: 1, z: 1},
      position: {x: 1, y: 0.5, z: 0},
      initClass: {},
      isTransform: true,
      isRotation: false,
    }
  ] as any)
  const activeGroup = ref(null as any)
  const findCurGroup = (id: number) => {
    if(id < 0 || !modelList.value){
      throw new Error('id is null')
    }
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
    findCurGroup
  }
})