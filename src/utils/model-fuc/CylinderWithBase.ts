/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义圆柱体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
import { ENUM_Box_Faces } from '../enum'
import { disposeObject } from '../three-fuc'
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

  public addOutletModel = (faceIndex: number, options?: { radius?: number; length?: number; color?: number }) => {
    // const this.group = curModel.getObject3D()
    this.group.traverse((child: THREE.Object3D) => { 
      if (child.name === 'outlet-model') {
        // console.log("child===>", child);
        child.parent!.remove(child)
        disposeObject(child)
      }
    });
    let faceName = ENUM_Box_Faces[faceIndex] as string
    console.log("faceName===>", faceName);
    // console.log(curModel.faces[faceName])
    const faceMesh: THREE.Mesh | undefined = this.faces?.[faceName]
    if (!faceMesh) {
      console.warn("face not found", faceName)
      return
    }
    
    const radius = options?.radius ?? 0.1
    const cylLength = options?.length ?? (this.thickness -0.01)
    const color = options?.color ?? 0xa395a3
    const cylGeom = new THREE.CylinderGeometry(radius, radius, cylLength, 32)
    const cylMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    const cylinder = new THREE.Mesh(cylGeom, cylMat)
    cylinder.name = 'outlet-model'
    console.log(cylinder)
    cylinder.add(new THREE.AxesHelper(0.3))
    switch (faceName) {
      case 'front':
      case 'back':
        cylinder.rotation.x = Math.PI / 2
        break
      case 'left':
      case 'right':
        cylinder.rotation.z = Math.PI / 2
        break
    }
    console.log(cylinder)
    if(faceName == 'left' ){
      cylinder.position.set(this.radius/2 - this.thickness,0,0)
    }
    faceMesh.add(cylinder)
  }
  public setOutletOffset = (offsetX: number, offsetY: number) => {
    console.log("setOutletOffset===>", offsetX, offsetY);
    let faceMesh: THREE.Mesh | any = undefined
    let outlet: THREE.Object3D | any = null;
    this.group.traverse((child: THREE.Object3D) => { 
      if (child.name === 'outlet-model') {
        outlet = child
        faceMesh = child.parent
        return
      }
    });
    // console.log("faceMesh===>", faceMesh ,outlet);
    // console.log("faceMesh===>", outlet.position.clone());
    if(!faceMesh){
      console.warn("outlet not found")
      return
    }
    
    if (!outlet) {
      console.warn("outlet not found on face");
      return;
    }
    if(faceMesh.name =='top' || faceMesh.name =='bottom'){
      outlet.position.set(offsetX,0,0);
    }else if(faceMesh.name =='left' || faceMesh.name =='right'){
      const height = this.height  ?? 1;
      const baseY = height / 2;
      outlet.position.set(this.radius/2-this.thickness,offsetY-baseY,0)
    }
  }
}
