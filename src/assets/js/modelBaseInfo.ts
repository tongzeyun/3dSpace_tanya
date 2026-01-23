/**
 * @Author: Travis
 * @Date: 2025-11-21 17:00:49
 * @Description: 场景中模型基础数据类型，可作为初始化模型参数
 * @LastEditTime: 2025-11-21 17:00:49
 * @LastEditors: Travis
 */

export const flangeBaseOptions = {
  color: 0xa395a3,
  drawDiameter: 0.016,
  actualDiameter: 0.016,
  length:0.004,
  thickness: 0.005
}

// 直管基础参数
export const pipeBaseOptions = {
  type: 'Pipe',
  length:1,
  diameter: 0,
  thickness: 0.002,
  isRoot: true,
  isTransform: true,
  isRotation: false,
}

// 弯管基础数据
export const bendBaseOptions = {
  type: 'Bend',
  diameter: 0.1,
  thickness: 0.002,
  bendRadius: 0.5,
  bendAngleDeg: 90,
  thetaStartDeg: -90,
  tubularSegments: 200,
  radialSegments: 32,
  isRoot: true,
  isTransform: false,
  isRotation: true,
  color: 0xa395a3,
}

// 三通
export const teeBaseOptions = {
  type: 'Tee',
  mainDiameter: 0,
  branchDiameter: 0,
  thickness: 0.002,
  isRoot: true,
  isTransform: false,
  isRotation: true,
}

// L形
export const LTubeBaseOptions = {
  type: 'LTube',
  diameter: 0,
  thickness: 0.002,
  isRoot: true,
  isTransform: false,
  isRotation: true,
}
// 异径管
export const reducerBaseOptions = {
  type: 'Reducer',
  thickness: 0.002,
  isRoot: true,
  isTransform: false,
  isRotation: false,
  radialSegments: 32,
}

export const crossBaseOptions = {
  type: 'Cross',
  thickness: 0.002,
  radialSegments: 32,
  isRoot: true,
  isTransform: false,
  isRotation: true,
}

export const fenziPumpBaseList:any[] = []

// export const fenziPumpBaseList = [
//   {
//     url:'./models/pump/fenzi.glb',
//     diameter:0.063,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.0055,-0.002,0.05],
//     indir:[0,0,1], 
//     scale:[0.05,0.05,0.05],
//   },
//   {
//     url:'./models/pump/fenzi.glb',
//     diameter:0.100,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.0085,-0.002,0.075],
//     indir:[0,0,1], 
//     scale:[0.075,0.075,0.075],
//   },
//   {
//     url:'./models/pump/fenzi.glb',
//     diameter:0.160,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.014,-0.004,0.113],
//     indir:[0,0,1], 
//     scale:[0.115,0.115,0.115],
//   },
//   {
//     url:'./models/pump/fenzi_2.glb',
//     diameter:0.250,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.013,0,0.1725],
//     indir:[0,0,1], 
//     scale:[0.087,0.087,0.087],
//   },
// ]

export const liziPumpBaseList:any[] = []

// export const liziPumpBaseList = [
//   {
//     url:'./models/pump/lizi.glb',
//     diameter:0.040,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0,0.042,0],
//     indir:[0,1,0], 
//     scale:[0.028,0.028,0.028],
//   },
//   {
//     url:'./models/pump/lizi.glb',
//     diameter:0.063,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0,0.057,0],
//     indir:[0,1,0], 
//     scale:[0.038,0.038,0.038],
//   },
//   {
//     url:'./models/pump/lizi.glb',
//     diameter:0.100,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0,0.085,0],
//     indir:[0,1,0], 
//     scale:[0.057,0.057,0.057],
//   },
//   {
//     url:'./models/pump/lizi.glb',
//     diameter:0.160,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0,0.125,0],
//     indir:[0,1,0],
//     scale:[0.086,0.086,0.086],
//   },
//   {
//     url:'./models/pump/lizi.glb',
//     diameter:0.250,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0,0.193,0],
//     indir:[0,1,0],
//     scale:[0.13,0.13,0.13],
//   },
// ]

export const youPumpBaseList:any[] = []

// export const youPumpBaseList = [
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.016,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.029,0.031,0.076],
//     indir:[0,0,1], 
//     scale:[0.078,0.078,0.078],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.025,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.0365,0.038,0.094],
//     indir:[0,0,1], 
//     scale:[0.097,0.097,0.097],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.040,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.052,0.054,0.133],
//     indir:[0,0,1], 
//     scale:[0.138,0.138,0.138],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.063,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.072,0.076,0.187],
//     indir:[0,0,1], 
//     scale:[0.193,0.193,0.193],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.100,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.105,0.110,0.272],
//     indir:[0,0,1], 
//     scale:[0.281,0.281,0.281],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.160,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.16,0.1685,0.416],
//     indir:[0,0,1], 
//     scale:[0.43,0.43,0.43],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/you.glb',
//     diameter:0.250,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[-0.255,0.2685,0.66],
//     indir:[0,0,1], 
//     scale:[0.68,0.68,0.68],
//     modelDir:'+Z'
//   },
// ]

export const ganPumpBaseList:any[]= []

// export const ganPumpBaseList = [
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.016,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.0068,-0.035,0.101],
//     indir:[0,0,1], 
//     scale:[0.075,0.075,0.075],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.025,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.0075,-0.045,0.135],
//     indir:[0,0,1], 
//     scale:[0.1,0.1,0.1],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.040,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.012,-0.062,0.18],
//     indir:[0,0,1], 
//     scale:[0.1335,0.1335,0.1335],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.063,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.0168,-0.09,0.259],
//     indir:[0,0,1], 
//     scale:[0.192,0.192,0.192],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.100,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.026,-0.133,0.385],
//     indir:[0,0,1], 
//     scale:[0.285,0.285,0.285],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.160,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.039,-0.205,0.59],
//     indir:[0,0,1], 
//     scale:[0.439,0.439,0.439],
//     modelDir:'+Z'
//   },
//   {
//     url:'./models/pump/gan.glb',
//     diameter:0.250,
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0.059,-0.307,0.888],
//     indir:[0,0,1], 
//     scale:[0.659,0.659,0.659],
//     modelDir:'+Z'
//   },
// ]

// 阀门模型列表


export const valveBaseList:any = []

// export const valveBaseList = [
//   {
//     diameter:0.016, // 对应管道内径
//     url:'./models/valve/valve_16.glb', // 模型路径
//     outOffset:[0,0.08,0], // 出气口偏移
//     outdir:[0,1,0], // 出气口朝向
//     inOffset:[0,0,0], // 入气口偏移
//     indir:[0,-1,0], // 入气口朝向
//     scale:[0.1,0.1,0.1], // 缩放
//     rotateAxis:'Y', // 旋转轴
//   },
//   {
//     diameter:0.025,
//     url:'./models/valve/valve_16.glb',
//     outOffset:[0,0.12,0],
//     outdir:[0,1,0],
//     inOffset:[0,0,0],
//     indir:[0,-1,0],
//     scale:[0.15,0.15,0.15],
//     rotateAxis:'Y',
//   },
//   {
//     diameter:0.040,
//     url:'./models/valve/valve_16.glb',
//     outOffset:[0,0.16,0],
//     outdir:[0,1,0],
//     inOffset:[0,0,0],
//     indir:[0,-1,0],
//     scale:[0.2,0.2,0.2],
//     rotateAxis:'Y',
//   },
//   {
//     diameter:0.063,
//     url:'./models/valve/valve_63.glb',
//     outOffset:[0,0,0.041],
//     inOffset:[0,0,-0.019],
//     outdir:[0,0,1],
//     indir:[0,0,-1],
//     scale:[0.085,0.085,0.085],
//     rotateAxis:'Z',
//   },
//   {
//     diameter:0.100,
//     url:'./models/valve/valve_63.glb',
//     outOffset:[0,0,0.055],
//     inOffset:[0,0,-0.0255],
//     outdir:[0,0,1],
//     indir:[0,0,-1],
//     scale:[0.11,0.11,0.11],
//     rotateAxis:'Z',
//   },
//   {
//     diameter:0.160,
//     url:'./models/valve/valve_63.glb',
//     outOffset:[0,0,0.075],
//     inOffset:[0,0,-0.0365],
//     outdir:[0,0,1],
//     indir:[0,0,-1],
//     scale:[0.16,0.16,0.16],
//     rotateAxis:'Z',
//   },
//   {
//     diameter:0.250,
//     url:'./models/valve/valve_63.glb',
//     outOffset:[0,0,0.12],
//     inOffset:[0,0,-0.054],
//     outdir:[0,0,1],
//     indir:[0,0,-1],
//     scale:[0.245,0.245,0.245],
//     rotateAxis:'Z',
//   },
// ]