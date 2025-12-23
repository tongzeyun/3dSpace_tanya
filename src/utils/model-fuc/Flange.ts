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
  public id:string = String(Math.random()).slice(8)
  constructor(params: Partial<FlangeOptions> ) { 
    const defaults = { 
      position: new THREE.Vector3(0,0,0),
      rotation: new THREE.Vector3(0,0,0),
      scale:new THREE.Vector3(1,1,1),
      color: 0xa395a3,
      diameter: 0.016,
      length:0.01,
      thickness: 0.015
    }
    this.params = Object.assign({}, defaults, params)
    console.log('创建法兰模型',this.params);
    this.mesh = new THREE.Mesh()
    this.build()
  }
  private build() {
    // 外半径与内半径
    const outerRadius = this.params.diameter / 2 + 0.002 + this.params.thickness
    const innerRadius = this.params.diameter / 2 + 0.002
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
  rebuild() { 
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose()
    }
    if (this.mesh.material) {
      (this.mesh.material as THREE.Material).dispose()
    }
    console.log(this.params.diameter)
    const outerRadius = this.params.diameter / 2 + this.params.thickness + 0.002
    const innerRadius = this.params.diameter / 2 + 0.002
    const depth = this.params.length
    const color = this.params.color ?? 0xa395a3

    const shape = new THREE.Shape()
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2)
    const hole = new THREE.Path()
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 32
    }

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geom.translate(0, 0, -depth / 2)
    geom.rotateX(Math.PI / 2)

    // 3. 替换几何和材质 (不替换 this.mesh 本体)
    this.mesh.geometry = geom
    this.mesh.material = new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide
    })
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