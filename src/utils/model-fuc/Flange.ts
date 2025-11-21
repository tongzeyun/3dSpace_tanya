/**
 * @Author: Travis
 * @Date: 2025-11-20 16:42:57
 * @Description: 自定义法兰口类型
 * @LastEditTime: 2025-11-20 16:42:57
 * @LastEditors: Travis
 */
interface FlangeOptions {
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: { x: number; y: number; z: number }
  color?: number | string
  radius?: number
  length?: number
  // outflatten?: number
  // inflatten?: number
}
import * as THREE from 'three'
export class Flange extends THREE.Mesh { 
  params: Required<FlangeOptions>;
  mesh: THREE.Mesh;
  constructor(params: Partial<FlangeOptions> ) { 
    super()
    const defaults = { 
      position: new THREE.Vector3(0,0,0),
      rotation: new THREE.Vector3(0,0,0), 
      scale:new THREE.Vector3(1,1,1), 
      color: 0xa395a3, 
      radius: 0.1, 
      length:0.05, 
    }
    this.params = Object.assign({}, defaults, params)
    this.mesh = new THREE.Mesh()
    this.build()
  }
  private build() { 
    const radius = this.params.radius ?? 0.1
    const cylLength = this.params?.length ?? (this.params.length -0.01)
    const color = this.params?.color ?? 0xa395a3
    const cylGeom = new THREE.CylinderGeometry(radius, radius, cylLength, 32)
    const cylMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    this.mesh = new THREE.Mesh(cylGeom, cylMat)
    this.mesh.name = 'outlet-model'
    this.mesh.userData.canInteractive  = true // 将法兰设置成可以交互对象
    // this.mesh.add(new THREE.AxesHelper(0.3))
  }
  getObject3D() { 
    return this.mesh
  }
  // 计算法兰口出气孔相对于中心的偏移量和法线方向
  computedOutOffset() {
    return {
      pos:new THREE.Vector3(0,this.params.length/2,0),
      dir:new THREE.Vector3(0,1,0)
    }
  }
}