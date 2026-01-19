/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义胶囊模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

import * as THREE from 'three'
// import { ENUM_Box_Sides } from '../enum'
// import { disposeObject } from '../three-fuc'
import { Flange } from './Flange'
import { Port } from './Port'
interface CapsuleOptions {
  diameter: number        // 胶囊的球体内径
  height: number        // 中间圆柱部分的高度（不含半球）
  thickness: number     // 壁厚
  color?: string | number
  opacity?: number
  outflatten ?:number // 外层缩放倍率
  inflatten ?:number // 内层缩放倍率
  // id?: string | number
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

  // public radius: number
  // public height: number
  // public thickness: number
  public params: Required<CapsuleOptions>;
  public outflatten: number
  public inflatten: number
  public faces: Record<string, THREE.Mesh>
  public id:string = String(Math.random()).slice(4)
  public type = 'Chamber'
  public portList: Port[]
  public flanges: {flange:Flange,offset:number[]}[]
  public activeFace: THREE.Mesh | null = null;
  public activeFlange: {flange:Flange,offset:number[]} | null = null

  // public 
  constructor(options: CapsuleOptions) {
    const {
      diameter,
      height,
      thickness,
      color = 0xd6d5e3,
      opacity = 0.4,
      outflatten = 0.4,
      inflatten = 0.38,
    } = options

    // this.params.radius = radius
    // this.height = height
    // this.params.thickness = thickness
    this.outflatten = outflatten
    this.inflatten = inflatten
    this.params = Object.assign({}, {
      diameter,
      height,
      thickness,
      color,
      opacity,
      outflatten,
      inflatten,
    })
    console.log(this.params)
    this.group = new THREE.Group()
    this.group.userData = {...options}
    this.faces = {} as Record<string, THREE.Mesh>
    this.portList = []
    this.flanges = []

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
      new THREE.CylinderGeometry(diameter/2, diameter/2, height, 64),
      outerMat.clone(),
    )
    this.outerCylinder.name = 'side'
    this.faces.side = this.outerCylinder

    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(diameter/2 - thickness, diameter/2 - thickness, height, 64),
      innerMat.clone(),
    )
    
    /** 上半球out */
    this.outerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(diameter/2, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
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
      new THREE.SphereGeometry(diameter/2, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
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
      new THREE.SphereGeometry(diameter/2 - thickness, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
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
      new THREE.SphereGeometry(diameter/2 - thickness, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
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

  /** 修改颜色  */
  setColor(faceName: string ,color: number | string) {
    (this.faces[faceName].material as any).color = new THREE.Color(color);
  }

  /** 整体缩放胶囊 */
  setScale(scale: number) {
    this.group.scale.set(scale, scale, scale)
  }
  setPosition(x: number, y: number, z: number){
    this.group.position.set(x, y, z)
  }
  public setSeleteState(name:string,color:number = 0x72b0e6){
    if(!name) return
    this.activeFace = this.faces[name]
    this.setColor(name,color)

  }
  public setUnseleteState(){
    // this.setColor( 0xd6d5e3 ,[2,4])
    for(let name in this.faces){
      this.setColor(name, 0xd6d5e3)
    }
  }
  getObject3D() : THREE.Group {
    return this.group
  }
  public resize(options: Partial<CapsuleOptions>) { 
    const newRadius = options.diameter ?? this.params.diameter
    const newHeight = options.height ?? this.params.height
    const newThickness = options.thickness ?? this.params.thickness
    const newOut = options.outflatten ?? this.outflatten ?? 0.4
    const newIn = options.inflatten ?? this.inflatten ?? 0.38

    this.params.diameter = newRadius
    this.params.height = newHeight
    this.params.thickness = newThickness
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

  public addOutletModel = (options?: { radius?: number; length?: number; color?: number }) => {
    if(!this.activeFace) return
    let faceName = this.activeFace.name
    console.log("faceName===>", faceName,this.params.thickness);
    // console.log(curModel.faces[faceName])
    const faceMesh: THREE.Mesh | undefined = this.faces?.[faceName]
    if (!faceMesh) {
      console.warn("face not found", faceName)
      return
    }
    let obj = {
      diameter: options?.radius ?? 0.12,
      length: options?.length ?? (this.params.thickness - 0.001),
    }
    obj = Object.assign(obj, options)
    let flange = new Flange(obj)
    let flangeMesh = flange.getObject3D()
    // flangeMesh.add(new THREE.AxesHelper(0.3))
    
    if(faceName == 'side'){
      flangeMesh.rotation.z = -Math.PI / 2
      flangeMesh.position.set(this.params.diameter/2 - this.params.thickness,0,0)
    }
    else if(faceName =='top'){
      flangeMesh.position.set(0,this.params.diameter * 0.2 - this.params.thickness/2,0);
    }else if(faceName =='bottom'){
      flangeMesh.rotation.x = Math.PI
      flangeMesh.position.set(0,-this.params.diameter * 0.2 + this.params.thickness/2 ,0);
    }
    console.log(flangeMesh)
    let flangeInfo = flange.computedOutOffset()
    let port = new Port(
      flange,
      faceName,
      'out',
      flangeInfo.pos,
      flangeInfo.dir
    )
    flange.setPort(port)
    this.flanges.push({flange:flange,offset:[0,0.5]})
    this.portList.push(port)
    faceMesh.add(flangeMesh)
    this.setActiveFlange(flangeMesh.uuid)
  }
  public setOutletOffset = (offsetX: number, offsetY: number) => {
    console.log("setOutletOffset===>", offsetX, offsetY);
    let outlet: THREE.Object3D | any = this.activeFlange!.flange.getObject3D();
    let faceMesh: THREE.Mesh | any = outlet.parent
    if(!faceMesh){
      console.warn("outlet not found")
      return
    }
    if (!outlet) {
      console.warn("outlet not found on face");
      return;
    }
    if(faceMesh.name =='top'){
      outlet.position.set(offsetX,this.params.diameter * 0.2 - this.params.thickness/2,0);
    }else if(faceMesh.name =='side'){
      const height = this.params.height ?? 1;
      const baseY = height / 2;
      outlet.position.set(this.params.diameter/2-this.params.thickness,offsetY-baseY,0)
    }else if(faceMesh.name =='bottom'){
      outlet.position.set(offsetX, -this.params.diameter * 0.2 + this.params.thickness/2,0);
    }
  }
  public getPort = () => {
    let port = {} as Port
    this.portList.forEach(item => {
      if(item.parent.getObject3D().uuid == this.activeFlange?.flange.getObject3D().uuid)
      port = item 
    })
    return port
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
    [this.outerTopSphere, this.outerBottomSphere, this.innerTopSphere, this.innerBottomSphere].forEach((mesh) => {
      if (mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }
}