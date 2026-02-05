/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义圆柱体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
// import { ENUM_Box_Sides } from '../enum'
// import { disposeObject } from '../three-fuc'
import { Flange } from './Flange'
import { Port } from './Port'
import { disposeObject } from '../three-fuc'

const chamberBaseOptions = {
  type: 'Chamber',
  cType: '1',
  diameter: 1.083,
  height: 1.083,
  volume:1,
  thickness: 0.02,
  color: 0xd6d5e3,
  opacity: 0.4, 
  isRoot: true,
  isTransform: false,
  isRotation: false,
}
// 圆柱体
interface CylinderOptions {
  diameter: number
  height: number
  thickness: number            // 圆柱体壁厚
  color?: string | number;
  opacity?: number
  // id ?: string | number
  // baseColor?: THREE.ColorRepresentation
}
export class CylinderWithBase {
  group: THREE.Group
  private outerCylinder: THREE.Mesh
  private innerCylinder: THREE.Mesh
  private topBase: THREE.Mesh
  private bottomBase: THREE.Mesh
  public params: Required<CylinderOptions>;
  public faces: Record<string, THREE.Mesh>
  public id: string;
  public type = 'Chamber'
  public portList: Port[]
  public flanges: {flange:Flange,offset:number[]}[]
  public activeFace: THREE.Mesh | null = null;
  public activeFlange: {flange:Flange,offset:number[]} | null = null

  constructor(options: any) {
    this.params = Object.assign({}, chamberBaseOptions, options)
    const { 
      diameter, 
      height, 
      thickness, 
      color = 0xd6d5e3, 
      opacity = 0.4,
    } = this.params
    this.faces = {} as Record<string, THREE.Mesh>
    this.portList = []
    this.flanges = []
    this.id = options.id || String(Math.random()).slice(4)
    this.group = new THREE.Group()
    this.group.name = 'objchamber'
    this.group.userData = {...this.params}
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
      new THREE.CylinderGeometry(diameter / 2, diameter /2, height, 64),
      cylinderMat.clone()
    )
    this.outerCylinder.name = 'side'

    /** 内圆柱 */
    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(diameter/2 - thickness, diameter /2- thickness, height, 64),
      cylinderMat.clone()
    )

    /** 顶部底座 */
    this.topBase = new THREE.Mesh(
      new THREE.CylinderGeometry(diameter/2, diameter/2, thickness, 64),
      baseMat.clone()
    )
    // this.topBase.add(new THREE.AxesHelper(0.3))
    this.topBase.position.y = height / 2 + thickness / 2
    this.topBase.name = 'top'


    /** 底部底座 */
    this.bottomBase = new THREE.Mesh(
      new THREE.CylinderGeometry(diameter/2, diameter/2, thickness, 64),
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

    let flangeList = options.flangeList
    if(flangeList && Array.isArray(flangeList) && flangeList?.length > 0){
      flangeList.forEach((flangeData:any) => {
        console.log('flangeData',flangeData)
        let facename = flangeData.flange.params.faceName
        console.log('facename',facename)
        if(!facename) return
        this.setSeleteState(facename)
        let obj = {
          id:flangeData.flange.id,
          ...flangeData.flange.params,
        }
        this.addOutletModel(obj)
        this.setOutletOffset(flangeData.offset[0], flangeData.offset[1])
      })
    }
    let portList = options.portList
    if(portList && Array.isArray(portList) && portList?.length > 0){
      portList.forEach((p:any) => {
        let curFlange = this.flanges.find((f:any) => f.flange.id == p.parent) 
        if(!curFlange) return
        curFlange.flange.getPort()!.id = p.id
      })
    }
  }

  /** 修改圆柱体半径 */
  // setdiameter(diameter: number) {
  //   this.outerCylinder.geometry.dispose()
  //   this.innerCylinder.geometry.dispose()

  //   this.outerCylinder.geometry = new THREE.CylinderGeometry(diameter, diameter, this.params.height, 64)
  //   this.innerCylinder.geometry = new THREE.CylinderGeometry(diameter - this.params.thickness, diameter - this.params.thickness, this.params.height, 64)
  // }

  /** 修改圆柱体高度 */
  // setHeight(height: number) {
  //   this.outerCylinder.geometry.dispose()
  //   this.innerCylinder.geometry.dispose()

  //   this.outerCylinder.geometry = new THREE.CylinderGeometry(this.params.diameter, this.params.diameter, height, 64)
  //   this.innerCylinder.geometry = new THREE.CylinderGeometry(this.params.diameter - this.params.thickness, this.params.diameter - this.params.thickness, height, 64)

  //   // 更新底座位置
  //   this.topBase.position.y = height / 2 + this.params.thickness / 2
  //   this.bottomBase.position.y = -height / 2 - this.params.thickness / 2
  // }
  /** 修改透明度 / 颜色 */
  setColor(faceName: string, color: number | string) {
    const face: any = this.faces[faceName]
    // console.log(face)
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
  // private getdiameter() { return (this.outerCylinder.geometry as THREE.CylinderGeometry).parameters.diameterTop }
  // private getHeight() { return (this.outerCylinder.geometry as THREE.CylinderGeometry).parameters.height }
  // private getThickness() {
  //   return this.getdiameter() -
  //     (this.innerCylinder.geometry as THREE.CylinderGeometry).parameters.diameterTop
  // }
  getObject3D() : THREE.Group {
    return this.group
  }
  public resize(options: Partial<CylinderOptions>) { 
    // console.log('options', options,this)
    const newdiameter = options.diameter ?? this.params.diameter
    const newHeight = options.height ?? this.params.height
    const newThickness = options.thickness ?? this.params.thickness

    this.params.diameter = newdiameter
    this.params.height = newHeight
    this.params.thickness = newThickness

    const innerdiameter = Math.max(0.001, newdiameter/2 - Math.max(0, newThickness))
    // console.log('innerdiameter', innerdiameter)
    // 释放旧几何体
    this.outerCylinder.geometry.dispose()
    this.innerCylinder.geometry.dispose()
    this.topBase.geometry.dispose()
    this.bottomBase.geometry.dispose()

    this.outerCylinder.geometry = new THREE.CylinderGeometry(newdiameter/2, newdiameter/2, newHeight, 64)
    this.innerCylinder.geometry = new THREE.CylinderGeometry(innerdiameter, innerdiameter, newHeight, 64)
    this.topBase.geometry = new THREE.CylinderGeometry(newdiameter/2, newdiameter/2, newThickness, 64)
    this.bottomBase.geometry = new THREE.CylinderGeometry(newdiameter/2, newdiameter/2, newThickness, 64)

    this.topBase.position.y = newHeight / 2 + newThickness / 2
    this.bottomBase.position.y = -newHeight / 2 - newThickness / 2

    return this
  }
  public findFlangeByUUID(id:string){ 
    return this.flanges.find(item=>item.flange.getObject3D().uuid === id)
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
  public addOutletModel = (options?: { drawDiameter?: number;actualDiameter?:number ;length?: number; color?: number }) => {
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
      drawDiameter: options?.drawDiameter ?? 0.12,
      actualDiameter: options?.actualDiameter ?? 0.12,
      length: options?.length ?? (this.params.thickness - 0.001),
      faceName: faceName,
    }
    obj = Object.assign(obj, options)
    let flange = new Flange(obj)
    let flangeMesh = flange.getObject3D()
    let offsetArr = [0,0]
    // cylinder.add(new THREE.AxesHelper(0.3))
    switch (faceName) {
      // case 'top':
      case 'bottom':
        flangeMesh.rotation.x = Math.PI
        break
      case 'side':
        flangeMesh.rotation.z = -Math.PI / 2
        flangeMesh.position.set(this.params.diameter/2 - this.params.thickness,0,0)
        offsetArr = [0,this.params.height / 2]
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
    flange.setPort(port)
    this.flanges.push({flange:flange,offset:offsetArr})
    this.portList.push(port)
    faceMesh.add(flangeMesh)
    this.setActiveFlange(flangeMesh.uuid)
    this.setOutletOffset(offsetArr[0], offsetArr[1])
  }
  public setOutletOffset = (offsetX: number, offsetY: number) => {
    console.log("setOutletOffset===>", offsetX, offsetY);
    let outlet: THREE.Object3D | any = this.activeFlange!.flange.getObject3D();
    let port = this.activeFlange!.flange.getPort();
    if(!port) return;
    let faceMesh: THREE.Mesh | any = outlet.parent
    // console.log("faceMesh===>", faceMesh ,outlet);
    // console.log("faceMesh===>", outlet.position.clone());
    if(!faceMesh){
      console.error("faceMesh not found")
      return
    }
    if (!outlet) {
      console.error("outlet not found");
      return;
    }
    if(faceMesh.name =='top' || faceMesh.name =='bottom'){
      let dig = offsetX / 180 * Math.PI
      const zOffset = offsetY * Math.sin(dig)
      const xOffset = offsetY * Math.cos(dig)
      outlet.position.set(xOffset,0,zOffset);
    }else if(faceMesh.name =='side'){
      let dig = offsetX / 180 * Math.PI
      let r = this.params.diameter / 2
      const zOffset = r * Math.sin(dig)
      const xOffset = r * Math.cos(dig)
      const height = this.params.height  ?? 1;
      const baseY = height / 2;
      // outlet.position.set(this.params.diameter/2-this.params.thickness,offsetY-baseY,0)
      outlet.position.set(xOffset,offsetY-baseY,zOffset)
      outlet.rotation.y = -dig
    }
    this.notifyPortsUpdated(port)
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

  public delFlange (){
    disposeObject(this.activeFlange?.flange.getObject3D() as THREE.Object3D)
    this.activeFlange?.flange.getObject3D().parent?.remove(this.activeFlange.flange.getObject3D())
    this.flanges = this.flanges.filter(item=>item!=this.activeFlange)
    this.activeFlange = null
  }

  notifyPortsUpdated(port: Port) {
    if(!port) return
    // console.log('notifyPortsUpdated', port)
    port.onParentTransformChanged()
    // for (const port of this.portList) {
    //   if(port.connected && port.isConnected){
    //     // console.log('port notifyPortsUpdated===>', port);
    //     // this.updatePortList()
    //     port.onParentTransformChanged();
    //   }
    // }
  }

  // 模型销毁时调用
  dispose() {
    // 断开所有端口连接
    this.portList.forEach((port: Port) => {
      if (port.connected) {
        port.connected.connected = null;
        port.connected.isConnected = false;
        port.connected = null;
        port.isConnected = false;
      }
    });
    // 清理几何体和材质
    if (this.outerCylinder) {
      if (this.outerCylinder.geometry) this.outerCylinder.geometry.dispose();
      if (this.outerCylinder.material) {
        if (Array.isArray(this.outerCylinder.material)) {
          this.outerCylinder.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          this.outerCylinder.material.dispose();
        }
      }
    }
    if (this.innerCylinder) {
      if (this.innerCylinder.geometry) this.innerCylinder.geometry.dispose();
      if (this.innerCylinder.material) {
        if (Array.isArray(this.innerCylinder.material)) {
          this.innerCylinder.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          this.innerCylinder.material.dispose();
        }
      }
    }
    if (this.topBase) {
      if (this.topBase.geometry) this.topBase.geometry.dispose();
      if (this.topBase.material) {
        if (Array.isArray(this.topBase.material)) {
          this.topBase.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          this.topBase.material.dispose();
        }
      }
    }
    if (this.bottomBase) {
      if (this.bottomBase.geometry) this.bottomBase.geometry.dispose();
      if (this.bottomBase.material) {
        if (Array.isArray(this.bottomBase.material)) {
          this.bottomBase.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          this.bottomBase.material.dispose();
        }
      }
    }
  }
}
