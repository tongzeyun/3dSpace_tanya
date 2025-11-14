/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义胶囊模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
import { ENUM_Box_Faces } from '../enum'
import { disposeObject } from '../three-fuc'
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

  public radius: number
  public height: number
  public thickness: number
  public outflatten: number
  public inflatten: number
  public faces: Record<string, THREE.Mesh>

  constructor(options: CapsuleOptions) {
    const {
      radius,
      height,
      thickness,
      color = 0xd6d5e3,
      opacity = 0.4,
      // topBottomScale = 0.4, 
      outflatten = 0.4,
      inflatten = 0.38,
    } = options

    this.radius = radius
    this.height = height
    this.thickness = thickness
    this.outflatten = outflatten
    this.inflatten = inflatten

    this.group = new THREE.Group()
    this.group.userData.type = 'chamber'
    this.faces = {} as Record<string, THREE.Mesh>
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
      new THREE.CylinderGeometry(radius/2, radius/2, height, 64),
      outerMat.clone(),
    )
    this.outerCylinder.name = 'left'
    this.faces.left = this.outerCylinder

    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius/2 - thickness, radius/2 - thickness, height, 64),
      innerMat.clone(),
    )
    
    /** 上半球out */
    this.outerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius/2, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      outerMat.clone()
    )
    this.outerTopSphere.position.y = height / 2
    this.outerTopSphere.name = 'top'
    this.faces.top = this.outerTopSphere
    // this.outerTopSphere.scale.y = topBottomScale
    const outerTopPos = this.outerTopSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < outerTopPos.count; i++) {
      outerTopPos.setY(i, outerTopPos.getY(i) * outflatten)
    }
    outerTopPos.needsUpdate = true
    this.outerTopSphere.geometry.computeVertexNormals()

    /** 下半球 out*/
    this.outerBottomSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius/2, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
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
    this.outerBottomSphere.name = 'bottom'
    this.faces.bottom = this.outerBottomSphere
    /** 上半球 Inner*/
    this.innerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius/2 - thickness, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
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
      new THREE.SphereGeometry(radius/2 - thickness, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
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
    const newRadius = options.radius ?? this.radius
    const newHeight = options.height ?? this.height
    const newThickness = options.thickness ?? this.thickness
    const newOut = options.outflatten ?? this.outflatten ?? 0.4
    const newIn = options.inflatten ?? this.inflatten ?? 0.38

    this.radius = newRadius
    this.height = newHeight
    this.thickness = newThickness
    this.outflatten = newOut
    this.inflatten = newIn

    const outerR = newRadius / 2
    const innerR = Math.max(0.001, outerR - Math.max(0, newThickness))

    this.outerCylinder.geometry.dispose()
    this.innerCylinder.geometry.dispose()
    this.outerTopSphere.geometry.dispose()
    this.outerBottomSphere.geometry.dispose()
    this.innerTopSphere.geometry.dispose()
    this.innerBottomSphere.geometry.dispose()

    // 重建几何体
    this.outerCylinder.geometry = new THREE.CylinderGeometry(outerR, outerR, newHeight, 64)
    this.innerCylinder.geometry = new THREE.CylinderGeometry(innerR, innerR, newHeight, 64)
    this.outerTopSphere.geometry = new THREE.SphereGeometry(outerR, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    this.outerBottomSphere.geometry = new THREE.SphereGeometry(outerR, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
    this.innerTopSphere.geometry = new THREE.SphereGeometry(innerR, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    this.innerBottomSphere.geometry = new THREE.SphereGeometry(innerR, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
    
    this.outerTopSphere.position.y = newHeight / 2
    this.outerBottomSphere.position.y = -newHeight / 2
    this.innerTopSphere.position.y = newHeight / 2
    this.innerBottomSphere.position.y = -newHeight / 2
    const applyFlatten = (geom: THREE.BufferGeometry, factor: number) => {
      const pos = geom.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, pos.getY(i) * factor)
      }
      pos.needsUpdate = true
      geom.computeVertexNormals()
    }
    applyFlatten(this.outerTopSphere.geometry as THREE.BufferGeometry, newOut)
    applyFlatten(this.outerBottomSphere.geometry as THREE.BufferGeometry, newOut)
    applyFlatten(this.innerTopSphere.geometry as THREE.BufferGeometry, newIn)
    applyFlatten(this.innerBottomSphere.geometry as THREE.BufferGeometry, newIn)
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
    console.log("faceName===>", faceName,this.thickness);
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
    faceMesh.add(cylinder)
    if(faceName == 'left'){
      cylinder.rotation.z = Math.PI / 2
      cylinder.position.set(this.radius/2 - this.thickness,0,0)
    }else if(faceName =='top'){
      cylinder.position.set(0,this.radius * 0.2 - this.thickness/2,0);
    }else if(faceName =='bottom'){
      cylinder.position.set(0,-this.radius * 0.2 + this.thickness/2 ,0);
    }
    console.log(cylinder)
    
    // console.log('cylinder getWorldPosition',cylinder.getWorldPosition(new THREE.Vector3()))
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
    // if()
    if(faceMesh.name =='top' ){
      outlet.position.set(offsetX,this.radius * 0.2 - this.thickness/2,0);
    }else if(faceMesh.name =='left' || faceMesh.name =='right'){
      const height = this.height  ?? 1;
      const baseY = height / 2;
      outlet.position.set(this.radius/2-this.thickness,offsetY-baseY,0)
    }else if(faceMesh.name =='bottom'){
      outlet.position.set(offsetX, -this.radius * 0.2 + this.thickness/2,0);
    }
  }
}