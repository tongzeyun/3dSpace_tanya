/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义胶囊模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
interface CapsuleOptions {
  radius: number        // 胶囊的球体半径
  height: number        // 中间圆柱部分的高度（不含半球）
  thickness: number     // 壁厚
  color?: THREE.ColorRepresentation
  opacity?: number
  outflatten ?:number // 外层缩放倍率
  inflatten ?:number // 内层缩放倍率
}

// 带壁厚的胶囊体
export class CapsuleWithThickness {
  group: THREE.Group

  private outerCylinder: THREE.Mesh
  private innerCylinder: THREE.Mesh

  private outerTopSphere: THREE.Mesh
  private outerBottomSphere: THREE.Mesh

  private innerTopSphere: THREE.Mesh
  private innerBottomSphere: THREE.Mesh

  constructor(options: CapsuleOptions) {
    const {
      radius,
      height,
      thickness,
      color = 0xd6d5e3,
      opacity = 0.4,
      // topBottomScale = 0.4, 
      outflatten = 0.4,
      inflatten = 0.385,
    } = options

    this.group = new THREE.Group()
    this.group.userData.type = 'chamber'
    /** 外壳材质 **/
    const outerMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })

    /** 内壳材质 **/
    const innerMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,   //  反向法线使内层可见
    })

    /** 中间圆柱部分 */
    this.outerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 64),
      outerMat.clone(),
    )

    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - thickness, radius - thickness, height, 64),
      innerMat.clone(),
    )

    /** 上半球 */
    this.outerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      outerMat.clone()
    )
    this.outerTopSphere.position.y = height / 2
    // this.outerTopSphere.scale.y = topBottomScale
    const outerTopPos = this.outerTopSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < outerTopPos.count; i++) {
      outerTopPos.setY(i, outerTopPos.getY(i) * outflatten)
    }
    outerTopPos.needsUpdate = true
    this.outerTopSphere.geometry.computeVertexNormals()

    /** 下半球 */
    this.outerBottomSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      outerMat.clone()
    )
    this.outerBottomSphere.position.y = -height / 2
    // this.outerBottomSphere.scale.y = topBottomScale
    const outerBottomPos = this.outerBottomSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < outerBottomPos.count; i++) {
      outerBottomPos.setY(i, outerBottomPos.getY(i) * outflatten)
    }
    outerBottomPos.needsUpdate = true
    this.outerBottomSphere.geometry.computeVertexNormals()

    /** 上半球 Inner*/
    this.innerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius - thickness, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      innerMat.clone()
    )
    this.innerTopSphere.position.y = height / 2
    // this.innerTopSphere.scale.y = topBottomScale 
    const innerTopPos = this.innerTopSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < innerTopPos.count; i++) {
      innerTopPos.setY(i, innerTopPos.getY(i) * inflatten)
    }
    innerTopPos.needsUpdate = true
    this.innerTopSphere.geometry.computeVertexNormals()

    /** 下半球 */
    this.innerBottomSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius - thickness, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      innerMat.clone()
    )
    this.innerBottomSphere.position.y = -height / 2
    // this.innerBottomSphere.scale.y = topBottomScale
    const innerBottomPos = this.innerBottomSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < innerBottomPos.count; i++) {
      innerBottomPos.setY(i, innerBottomPos.getY(i) * inflatten)
    }
    innerBottomPos.needsUpdate = true
    this.innerBottomSphere.geometry.computeVertexNormals()

    /** 统一到 group */
    this.group.add(
      this.outerCylinder, this.outerTopSphere, this.outerBottomSphere,
      this.innerCylinder, this.innerTopSphere, this.innerBottomSphere
    )
  }

  /** 修改颜色 & 透明度 */
  setColor(color: THREE.ColorRepresentation, opacity?: number) {
    const mats = [
      this.outerCylinder.material,
      this.innerCylinder.material,
      this.outerTopSphere.material,
      this.outerBottomSphere.material,
      this.innerTopSphere.material,
      this.innerBottomSphere.material
    ] as THREE.MeshPhysicalMaterial[]

    mats.forEach(mat => {
      mat.color.set(color)
      if (opacity !== undefined)
        mat.opacity = opacity
      mat.needsUpdate = true
    })
  }

  /** 整体缩放胶囊 */
  setScale(scale: number) {
    this.group.scale.set(scale, scale, scale)
  }
  setPosition(x: number, y: number, z: number){
    this.group.position.set(x, y, z)
  }
  public setSeleteState(color:number){
    const topMeshes = [
      this.outerTopSphere.material,
      this.innerTopSphere.material,
    ] as THREE.MeshPhysicalMaterial[]

    topMeshes.forEach(mat => {
      mat.color.set(color)
      mat.needsUpdate = true
    })
  }
  getObject3D() : THREE.Group {
    return this.group
  }
  public resize(options: Partial<CapsuleOptions>) { 
    
  }
}