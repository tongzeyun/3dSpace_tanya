/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义圆柱体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
import { ENUM_Box_Sides } from '../enum'
import { disposeObject } from '../three-fuc'
import { Flange } from './Flange'
import { Port } from './Port'
// 圆柱体
interface CylinderOptions {
  radius: number
  height: number
  thickness: number            // 圆柱体壁厚
  color?: THREE.ColorRepresentation
  opacity?: number
  id ?: string | number
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
  public id: string
  public type = 'Chamber'
  public portList: Port[]
  public flanges: {flange:Flange,offset:number[]}[]
  public activeFace: THREE.Mesh | null = null;
  public activeFlange: {flange:Flange,offset:number[]} | null = null

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
    this.portList = []
    this.flanges = []
    this.group = new THREE.Group()
    this.group.userData = {...options}
    this.id = String(Math.random()).slice(4)
    const cylinderMat = new THREE.MeshPhysicalMaterial({
      // color,
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
      color,
      opacity,
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })

    /** 外圆柱 */
    this.outerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius / 2, radius /2, height, 64),
      cylinderMat.clone()
    )
    this.outerCylinder.name = 'side'

    /** 内圆柱 */
    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius/2 - thickness, radius /2- thickness, height, 64),
      cylinderMat.clone()
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
    this.bottomBase.position.y = -height / 2 - thickness /2
    // this.bottomBase.add(new THREE.AxesHelper(0.3))
    this.bottomBase.name = 'bottom'

    this.group.add( this.outerCylinder,this.innerCylinder , this.topBase, this.bottomBase)
    
    this.faces = {
      top: this.topBase,
      bottom: this.bottomBase,
      side: this.outerCylinder,
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
  setColor(faceName: string, color: number | string) {
    const face: any = this.faces[faceName]
    console.log(face)
    if(!face) return
    face.material.color = new THREE.Color(color);
    // (this.topBase.material as any).color = new THREE.Color(color)
  }

  // 修改选中时面颜色
  public setSeleteState(name:string,color:number = 0x72b0e6){
    console.log(name)
    this.activeFace = this.faces[name]
    this.setColor(name,color)
  }

  public setUnseleteState(){
    // this.setColor( 'top',0xd6d5e3)
    for(let name in this.faces){
      this.setColor(name, 0xd6d5e3)
    }
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

  public setActiveFlange = (id:string) => {
    this.activeFlange = null
    this.flanges.forEach((item) =>{
      if(item.flange.getObject3D().uuid == id){
        this.activeFlange = item
        console.log(this.activeFlange)
        this.activeFlange.flange.setColor('#42b883')
      }else{
        item.flange.setColor('#d6d5e3')
      }
    })
    // console.log(this.activeFlange)
  }
  public addOutletModel = (options?: { radius?: number; length?: number; color?: number }) => {
    if(!this.activeFace) return
    let faceName = this.activeFace.name
    console.log("faceName===>", faceName);
    // console.log(curModel.faces[faceName])
    const faceMesh: THREE.Mesh | undefined = this.faces?.[faceName]
    if (!faceMesh) {
      console.warn("face not found", faceName)
      return
    }
    let obj = {
      radius: options?.radius ?? 0.1,
      length: options?.length ?? (this.thickness - 0.01),
      color: options?.color ?? 0xa395a3
    }
    obj = Object.assign(obj, options)
    let flange = new Flange(obj)
    let flangeMesh = flange.getObject3D()
    // cylinder.add(new THREE.AxesHelper(0.3))
    switch (faceName) {
      // case 'top':
      case 'bottom':
        flangeMesh.rotation.x = Math.PI
        break
      case 'side':
        flangeMesh.rotation.z = -Math.PI / 2
        flangeMesh.position.set(this.radius/2 - this.thickness,0,0)
        break
    }
    let flangeInfo = flange.computedOutOffset()
    let port = new Port(
      flange,
      faceName,
      'out',
      flangeInfo.pos,
      flangeInfo.dir
    )
    this.flanges.push({flange:flange,offset:[0,0.5]})
    this.portList.push(port)
    faceMesh.add(flangeMesh)
    this.setActiveFlange(flangeMesh.uuid)
  }
  public setOutletOffset = (offsetX: number, offsetY: number) => {
    console.log("setOutletOffset===>", offsetX, offsetY);
    let outlet: THREE.Object3D | any = this.activeFlange!.flange.getObject3D();
    let faceMesh: THREE.Mesh | any = outlet.parent
    // console.log("faceMesh===>", faceMesh ,outlet);
    // console.log("faceMesh===>", outlet.position.clone());
    if(!faceMesh){
      console.error("outlet not found")
      return
    }
    if (!outlet) {
      console.error("outlet not found on face");
      return;
    }
    if(faceMesh.name =='top' || faceMesh.name =='bottom'){
      outlet.position.set(offsetX,0,0);
    }else if(faceMesh.name =='side'){
      const height = this.height  ?? 1;
      const baseY = height / 2;
      outlet.position.set(this.radius/2-this.thickness,offsetY-baseY,0)
    }
  }
  public getPort = () => {
    let port = {} as Port
    this.portList.forEach(item => {
      if(item.parent.getObject3D().uuid == this.activeFlange?.flange.getObject3D().uuid)
      port = item
    })
    // let port = this.portList.find(item => item.name.includes(name) )
    // if(!port) return null
    return port
  }
}
