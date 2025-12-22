/**
 * @Author: Travis
 * @Date: 2025-11-21 17:00:49
 * @Description: 场景中模型基础数据类型，可作为初始化模型参数
 * @LastEditTime: 2025-11-21 17:00:49
 * @LastEditors: Travis
 */

import { ValveModelParams } from "@/utils/model-fuc/ValveModel"

// 仓体基础参数
export const chamberBaseOptions = {
  type: 'Chamber',
  name: 'chamber',
  cType: '0',
  width: 1,
  height: 1,
  length: 1,
  diameter: 1,
  thickness: 0.02,
  rotation: {x: 0, y: 0, z: 0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  hole_location_x: 0.5, 
  hole_location_y: 0.5, 
  hole_location_h: 0.5, 
  hole_location_r: 0,
  faceIndex: '5',
  // initClass: {},
  isRoot: true,
  isTransform: false,
  isRotation: false,
}

export const flangeBaseOptions = {
  rotation: {x: 0, y: 0, z: 0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  color: 0xa395a3,
  diameter: 0.016,
  length:0.004,
  thickness: 0.005
}

// 直管基础参数
export const pipeBaseOptions = {
  type: 'Pipe',
  name: 'Pipe',
  length:1,
  diameter: 0.1,
  thickness: 0.002,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  // initClass: {},
  isRoot: true,
  isTransform: true,
  isRotation: false,
  // canInteractive: true,
}

// 弯管基础数据
export const bendBaseOptions = {
  name: 'Bend',
  type: 'Bend',
  diameter: 0.1,
  thickness: 0.002,
  bendRadius: 0.5,
  bendAngleDeg: 90,
  thetaStartDeg: -90,
  tubularSegments: 200,
  radialSegments: 32,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  // initClass: {},
  isRoot: true,
  isTransform: false,
  isRotation: true,
  // canInteractive: true,
}
// 三通
export const teeBaseOptions = {
  name: 'Tee',
  type: 'Tee',
  mainLength: 0.5,
  brachLength: 0.2,
  mainDiameter: 0.1,
  branchDiameter: 0.08,
  thickness: 0.002,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  isRoot: true,
  isTransform: false,
  isRotation: true,
  // canInteractive: true,
}

// L形
export const LTubeBaseOptions = {
  name: 'LTube',
  type: 'LTube',
  length: 0.5,
  diameter: 0.1,
  thickness: 0.002,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  isRoot: true,
  isTransform: false,
  isRotation: true,
  // canInteractive: true,
}
// 异径管
export const reducerBaseOptions = {
  name: 'Reducer',
  type: 'Reducer',
  length: 0.5,
  innerStart: 0.2,
  innerEnd: 0.1,
  thickness: 0.002,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  isRoot: true,
  isTransform: false,
  isRotation: false,
}

export const crossBaseOptions = {
  name: 'Cross',
  type: 'Cross',
  lengthMain: 0.6,
  lengthBranch: 0.4,
  innerMain: 0.2,
  innerBranch: 0.15,
  thickness: 0.002,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  isRoot: true,
  isTransform: false,
  isRotation: true,
}

export const pumpBaseList = [
  {url:'',outOffset:[0,0,0]},

]

// 阀门模型列表
export const valveBaseList: ValveModelParams[] = [
  {
    diameter:0.016, // 对应管道内径
    url:'./models/valve/valve_16.glb', // 模型路径
    outOffset:[0,0.08,0], // 出气口偏移
    outdir:[0,1,0], // 出气口朝向
    inOffset:[0,0,0], // 入气口偏移
    indir:[0,-1,0], // 入气口朝向
    scale:[0.1,0.1,0.1], // 缩放
    rotateAxis:'Y', // 旋转轴
  },
  {
    diameter:0.025,
    url:'./models/valve/valve_16.glb',
    outOffset:[0,0.12,0],
    outdir:[0,1,0],
    inOffset:[0,0,0],
    indir:[0,-1,0],
    scale:[0.15,0.15,0.15],
    rotateAxis:'Y',
  },
  {
    diameter:0.040,
    url:'./models/valve/valve_16.glb',
    outOffset:[0,0.16,0],
    outdir:[0,1,0],
    inOffset:[0,0,0],
    indir:[0,-1,0],
    scale:[0.2,0.2,0.2],
    rotateAxis:'Y',
  },
  {
    diameter:0.063,
    url:'./models/valve/valve_63.glb',
    outOffset:[0,0,0.041],
    inOffset:[0,0,-0.019],
    outdir:[0,0,1],
    indir:[0,0,-1],
    scale:[0.085,0.085,0.085],
    rotateAxis:'Z',
  },
  {
    diameter:0.100,
    url:'./models/valve/valve_63.glb',
    outOffset:[0,0,0.055],
    inOffset:[0,0,-0.0255],
    outdir:[0,0,1],
    indir:[0,0,-1],
    scale:[0.11,0.11,0.11],
    rotateAxis:'Z',
  },
  {
    diameter:0.160,
    url:'./models/valve/valve_63.glb',
    outOffset:[0,0,0.075],
    inOffset:[0,0,-0.0365],
    outdir:[0,0,1],
    indir:[0,0,-1],
    scale:[0.16,0.16,0.16],
    rotateAxis:'Z',
  },
  {
    diameter:0.250,
    url:'./models/valve/valve_63.glb',
    outOffset:[0,0,0.12],
    inOffset:[0,0,-0.054],
    outdir:[0,0,1],
    indir:[0,0,-1],
    scale:[0.245,0.245,0.245],
    rotateAxis:'Z',
  },
]