import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProjectStore = defineStore( 'project', () => {
  // const modelList = ref([{
  //   type:'objChamber',
  //   name:'chamber',
  //   cType: '0',
  //   size:{
  //     w:'1',
  //     h:'1',
  //     d:'1'
  //   },
  //   position:{
  //     x:'0',
  //     y:'0',
  //     z:'0'
  //   },
  //   rotation:{
  //     x:'0',
  //     y:'0',
  //     z:'0'
  //   },
  //   thickness:0.05,
  //   hole_location_x: 0.5,
  //   hole_location_y: 0.5,
  //   hole_location_h: 0.5,
  //   hole_location_r: 0.5, 
  // }] as any)
  const modelList = ref([
    {
      type: 'chamber',
      name: 'chamber',
      cType: '0',
      x_size: 1,
      y_size: 1,
      z_size: 1,
      d_size: 1,
      h_size: 1,
      thickness: 0.05,
      rotation: {x: 0, y: 0, z: 0},
      scale: {x: 1, y: 1, z: 1},
      position: {x: 0, y: 0, z: 0},
      hole_location_x: 0.5, 
      hole_location_y: 0.5, 
      hole_location_h: 0.5, 
      hole_location_r: 0.5,
      faceIndex: '5',
    }
  ] as any)
  return {
    modelList,
  }
})