/**
 * @Author: Travis
 * @Date: 2025-11-21 17:00:49
 * @Description: 场景中模型基础数据类型，可作为初始化模型参数
 * @LastEditTime: 2025-11-21 17:00:49
 * @LastEditors: Travis
 */

// 仓体基础参数
export const chamberBaseOptions = {
  type: 'Chamber',
  name: 'chamber',
  cType: '0',
  width: 1,
  height: 1,
  length: 1,
  diameter: 1,
  thickness: 0.05,
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

// 直管基础参数
export const pipeBaseOptions = {
  type: 'Pipe',
  name: 'Pipe',
  length:1,
  diameter: 0.1,
  thickness: 0.01,
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
  thickness: 0.01,
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

export const teeBaseOptions = {
  name: 'Tee',
  type: 'Tee',
  mainLength: 0.5,
  brachLength: 0.2,
  mainDiameter: 0.1,
  branchDiameter: 0.08,
  thickness: 0.01,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  isRoot: true,
  isTransform: false,
  isRotation: true,
  // canInteractive: true,
}

export const LTubeBaseOptions = {
  name: 'LTube',
  type: 'LTube',
  length: 0.5,
  diameter: 0.1,
  thickness: 0.01,
  rotation: {x: 0, y: 0, z:0},
  scale: {x: 1, y: 1, z: 1},
  position: {x: 0, y: 0, z: 0},
  isRoot: true,
  isTransform: false,
  isRotation: true,
  // canInteractive: true,
}