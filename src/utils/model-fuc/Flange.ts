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
  diameter?: number
  length?: number
  thickness?: number
}
import * as THREE from 'three'
import { Port } from './Port';

export class Flange { 
  private mesh: THREE.Mesh;
  public params: Required<FlangeOptions>;
  public port: Port | null = null
  constructor(params: Partial<FlangeOptions> ) { 
    const defaults = { 
      position: new THREE.Vector3(0,0,0),
      rotation: new THREE.Vector3(0,0,0), 
      scale:new THREE.Vector3(1,1,1), 
      color: 0xa395a3, 
      diameter: 0.1, 
      length:0.05,
      thickness: 0.01
    }
    this.params = Object.assign({}, defaults, params)
    this.mesh = new THREE.Mesh()
    this.build()
  }
  private build() { 
    // const radius = this.params.diameter / 2 + this.params.thickness
    // const cylLength = this.params?.length ?? (this.params.length -0.01)
    // const color = this.params?.color ?? 0xa395a3
    // const cylGeom = new THREE.CylinderGeometry(radius, radius, cylLength, 32)
    // const cylMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    // this.mesh = new THREE.Mesh(cylGeom, cylMat.clone())

    // 外半径与内半径
    const outerRadius = this.params.diameter / 2 + this.params.thickness
    const innerRadius = this.params.diameter / 2
    const depth = this.params.length
    const color = this.params?.color ?? 0xa395a3

    // 使用 Shape + hole，再用 ExtrudeGeometry 挤出得到中空环状体
    const shape = new THREE.Shape()
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 32
    }
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    // Extrude 沿 +Z 方向，把几何体中心移到原点，然后绕 X 轴旋转使其轴向对齐 Y 轴
    geom.translate(0, 0, -depth / 2)
    geom.rotateX(Math.PI / 2)

    const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    this.mesh = new THREE.Mesh(geom, mat)


    this.mesh.name = 'flange-model'
    this.mesh.userData.canInteractive  = true // 将法兰设置成可以交互对象

    // const axesHelper = new THREE.AxesHelper(0.3);
    // axesHelper.raycast = function() {};
    // this.mesh.add(axesHelper);
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
  // 修改法兰口颜色
  setColor(color: number | string){
    (this.mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(color)
  }

  // 设置法兰对应的port信息
  setPort(port: Port) { 
    this.port = port
  }
  getPort(){
    return this.port
  }
}