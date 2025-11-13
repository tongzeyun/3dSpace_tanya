/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义圆柱体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
// 圆柱体
interface CylinderOptions {
  radius: number
  height: number
  thickness: number            // 圆柱体壁厚
  color?: THREE.ColorRepresentation
  opacity?: number
  // baseColor?: THREE.ColorRepresentation
}

export class CylinderWithBase {
  group: THREE.Group
  private outerCylinder: THREE.Mesh
  private innerCylinder: THREE.Mesh
  private topBase: THREE.Mesh
  private bottomBase: THREE.Mesh
  public radius: number
  public height: number
  public thickness: number
  public faces: Record<string, THREE.Mesh>

  constructor(options: CylinderOptions) {
    const { 
      radius, 
      height, 
      thickness, 
      color = 0xd6d5e3, 
      opacity = 0.4, 
      // baseColor = '#0077cc' 
    } = options
    this.radius = radius
    this.height = height
    this.thickness = thickness
    this.faces = {} as Record<string, THREE.Mesh>

    this.group = new THREE.Group()

    const cylinderMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })

    // const innerMat = new THREE.MeshPhysicalMaterial({
    //   color,
    //   opacity,
    //   transparent: true,
    //   depthWrite: false,
    //   side: THREE.BackSide, // 反转法线用于内壁
    // })

    const baseMat = new THREE.MeshStandardMaterial({
      color: color,
      opacity,
      transparent: true,
      depthWrite: true,
      side: THREE.BackSide,
    })

    /** 外圆柱 */
    this.outerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius / 2, radius /2, height, 64),
      cylinderMat
    )
    this.outerCylinder.name = 'left'

    /** 内圆柱 */
    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius/2 - thickness, radius /2- thickness, height, 64),
      cylinderMat
    )

    /** 顶部底座 */
    this.topBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius/2, radius/2, thickness, 64),
      baseMat.clone()
    )
    // this.topBase.add(new THREE.AxesHelper(0.3))
    this.topBase.position.y = height / 2 + thickness / 2
    this.topBase.name = 'top'


    /** 底部底座 */
    this.bottomBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius/2, radius/2, thickness, 64),
      baseMat.clone()
    )
    this.bottomBase.position.y = -height / 2 - thickness / 2
    // this.bottomBase.add(new THREE.AxesHelper(0.3))
    this.bottomBase.name = 'bottom'

    this.group.add(this.outerCylinder, this.innerCylinder, this.topBase, this.bottomBase)
    this.group.userData.type = 'chamber'

    this.faces = {
      top: this.topBase,
      bottom: this.bottomBase,
      left: this.outerCylinder,
    }
  }

  /** 修改圆柱体半径 */
  // setRadius(radius: number) {
  //   this.outerCylinder.geometry.dispose()
  //   this.innerCylinder.geometry.dispose()

  //   this.outerCylinder.geometry = new THREE.CylinderGeometry(radius, radius, this.height, 64)
  //   this.innerCylinder.geometry = new THREE.CylinderGeometry(radius - this.thickness, radius - this.thickness, this.height, 64)
  // }

  /** 修改圆柱体高度 */
  // setHeight(height: number) {
  //   this.outerCylinder.geometry.dispose()
  //   this.innerCylinder.geometry.dispose()

  //   this.outerCylinder.geometry = new THREE.CylinderGeometry(this.radius, this.radius, height, 64)
  //   this.innerCylinder.geometry = new THREE.CylinderGeometry(this.radius - this.thickness, this.radius - this.thickness, height, 64)

  //   // 更新底座位置
  //   this.topBase.position.y = height / 2 + this.thickness / 2
  //   this.bottomBase.position.y = -height / 2 - this.thickness / 2
  // }

  /** 修改透明度 / 颜色 */
  setColor(color: THREE.ColorRepresentation, opacity?: number) {
    const mats = [this.outerCylinder.material, this.innerCylinder.material] as THREE.Material[]
    mats.forEach(mat => {
      (mat as THREE.MeshPhysicalMaterial).color.set(color)
      if (opacity !== undefined) (mat as THREE.MeshPhysicalMaterial).opacity = opacity
    })
  }

  // 修改选中时面颜色
  public setSeleteState(color:number){
    // const face :any = this.faces['top']
    // face.material.color.set(color)
    (this.topBase.material as any).color.set(color)
  }

  /** 单独修改底座颜色 */
  setBottomBaseColor(color: THREE.ColorRepresentation) {
    // (this.topBase.material as THREE.MeshStandardMaterial).color.set(color);
    (this.bottomBase.material as THREE.MeshStandardMaterial).color.set(color)
  }

  /** 设置位置 */
  setPosition(x: number, y: number, z: number){
    this.group.position.set(x, y, z)
  }
  /** 获取参数 */
  // private getRadius() { return (this.outerCylinder.geometry as THREE.CylinderGeometry).parameters.radiusTop }
  // private getHeight() { return (this.outerCylinder.geometry as THREE.CylinderGeometry).parameters.height }
  // private getThickness() {
  //   return this.getRadius() -
  //     (this.innerCylinder.geometry as THREE.CylinderGeometry).parameters.radiusTop
  // }
  getObject3D() : THREE.Group {
    return this.group
  }
  public resize(options: Partial<CylinderOptions>) { 
    // console.log('options', options,this)
    const newRadius = options.radius ?? this.radius
    const newHeight = options.height ?? this.height
    const newThickness = options.thickness ?? this.thickness

    this.radius = newRadius
    this.height = newHeight
    this.thickness = newThickness

    const innerRadius = Math.max(0.001, newRadius/2 - Math.max(0, newThickness))
    // console.log('innerRadius', innerRadius)
    // 释放旧几何体
    this.outerCylinder.geometry.dispose()
    this.innerCylinder.geometry.dispose()
    this.topBase.geometry.dispose()
    this.bottomBase.geometry.dispose()

    this.outerCylinder.geometry = new THREE.CylinderGeometry(newRadius/2, newRadius/2, newHeight, 64)
    this.innerCylinder.geometry = new THREE.CylinderGeometry(innerRadius, innerRadius, newHeight, 64)
    this.topBase.geometry = new THREE.CylinderGeometry(newRadius/2, newRadius/2, newThickness, 64)
    this.bottomBase.geometry = new THREE.CylinderGeometry(newRadius/2, newRadius/2, newThickness, 64)

    this.topBase.position.y = newHeight / 2 + newThickness / 2
    this.bottomBase.position.y = -newHeight / 2 - newThickness / 2

    return this
  }
}
