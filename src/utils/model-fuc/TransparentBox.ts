/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义长方体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

// 主箱体类
import * as THREE from 'three'
// import { ENUM_Box_Faces } from '../enum'
import { Flange } from './Flange'
import { Port } from './Port';
import { disposeObject } from '../three-fuc';
type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
export interface FaceConfig {
  color?: number | string
  opacity?: number,
}
interface TransparentBoxOptions {
  width?: number // 宽度
  height?: number // 高度
  length?: number // 长度
  thickness?: number  // 厚度
  faceConfigs?: Partial<Record<FaceName, FaceConfig>> // 面属性配置
}
export class TransparentBox {
  // public length: number // 长度
  // public width: number // 宽度
  // public height: number // 高度
  // public thickness: number // 厚度
  public params: Required<TransparentBoxOptions>
  public group: THREE.Group
  public faces: Record<FaceName, THREE.Mesh>
  public flanges: {flange:Flange,offset:number[]}[]
  public id: string = String(Math.random()).slice(4)
  public type = 'Chamber'
  public portList: Port[] = [];
  public activeFace: THREE.Mesh | null = null
  public activeFlange: {flange:Flange,offset:number[]} | null = null
  constructor(options: TransparentBoxOptions = {}) {
    const {
      width = 1,
      height = 1,
      length = 1,
      thickness = 0.05,
      faceConfigs = {},
    } = options

    // this.width = width
    // this.height = height
    // this.length = length
    // this.thickness = thickness
    this.params = Object.assign({}, {
      width,
      height,
      length,
      thickness,
      faceConfigs,
    })

    this.group = new THREE.Group()
    this.group.userData = {...options}
    this.faces = {} as Record<FaceName, THREE.Mesh>
    this.flanges = []

    const defaultConfig: FaceConfig = { color: 0xd6d5e3, opacity: 0.4 }

    this.faces.front = this._createFace(
      'front',
      this.params.width - 2*this.params.thickness,
      this.params.height-this.params.thickness,
      this.params.thickness,
      { ...defaultConfig, ...faceConfigs.front }
    )
    this.faces.front.position.z = this.params.length / 2 - this.params.thickness / 2
    // this.faces.front.name = 'front'

    this.faces.back = this._createFace(
      'back',
      this.params.width - 2*this.params.thickness,
      this.params.height-this.params.thickness,
      this.params.thickness,
      { ...defaultConfig, ...faceConfigs.back }
    )
    // this.faces.back.rotation.x = Math.PI
    this.faces.back.position.z = -this.params.length / 2 + this.params.thickness / 2
    // this.faces.back.name = 'back'

    this.faces.top = this._createFace(
      'top',
      this.params.width,
      this.params.thickness,
      this.params.length,
      { ...defaultConfig, ...faceConfigs.top }
    )
    this.faces.top.position.y = this.params.height / 2

    this.faces.bottom = this._createFace(
      'bottom',
      this.params.width,
      this.params.thickness,
      this.params.length,
      { ...defaultConfig, ...faceConfigs.bottom }
    )
    this.faces.bottom.position.y = -this.params.height / 2

    this.faces.left = this._createFace(
      'left',
      this.params.thickness,
      this.params.height - this.params.thickness,
      this.params.length,
      
      { ...defaultConfig, ...faceConfigs.left }
    )
    this.faces.left.position.x = -this.params.width / 2 + this.params.thickness / 2

    this.faces.right = this._createFace(
      'right',
      this.params.thickness,
      this.params.height- this.params.thickness,
      this.params.length ,
      { ...defaultConfig, ...faceConfigs.right }
    )
    this.faces.right.position.x = this.params.width / 2 - this.params.thickness / 2;

    // 添加到组
    (Object.keys(this.faces) as FaceName[]).forEach((k) => {
      this.group.add(this.faces[k] as any)
    })
  }

  private _createFace(name:string , w: number, h: number, l:number, cfg: FaceConfig): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(w, h, l)
    const material = new THREE.MeshBasicMaterial({
      color: cfg.color ?? 0xffffff,
      transparent: true,
      opacity: cfg.opacity ?? 0.5,
      // roughness: 0.2,
      // metalness: 0.0,
      // transmission: 0.0,
      // thickness: this.thickness,
      side: THREE.FrontSide,
    })
    let mesh = new THREE.Mesh(geometry, material)
    // mesh.add(new THREE.AxesHelper(0.3))
    mesh.name = name
    // mesh.userData.canInteractive = true
    // outlet.add(new THREE.AxesHelper(0.5))
    // return new THREE.Mesh(geometry, material).add(new THREE.AxesHelper(0.5))
    // let outlet = this.addOutletModel(name)
    // if(outlet) mesh.add(outlet)
    // console.log(mesh)
    return mesh
  }

  public getObject3D(): THREE.Group {
    return this.group
  }

  public setFaceProperty(faceName: FaceName, cfg: FaceConfig) {
    const face :any= this.faces[faceName]
    if (!face) return
    if (cfg.color !== undefined) face.material.color.set(cfg.color as any)
    if (cfg.opacity !== undefined) face.material.opacity = cfg.opacity
    // 如果需要你可以强制更新材质：
    face.material.needsUpdate = true
  }

  public setSeleteState(name:FaceName,color:number = 0x72b0e6){
    // console.log(name)
    if(!name) return
    this.setFaceProperty(name, { color, opacity: 0.4 })
    this.activeFace = this.faces[name]
  }
  public setUnseleteState(){
    for(let name in this.faces){
      this.setFaceProperty((name as FaceName), { color: 0xd6d5e3, opacity: 0.4 })
    }
    
    // this.setFaceProperty('top', { color: 0xd6d5e3, opacity: 0.4 })
  }
  public setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z)
  }

  public setRotation(x: number, y: number, z: number) {
    this.group.rotation.set(x, y, z)
  }

  public setScale(x: number, y: number, z: number) {
    this.group.scale.set(x, y, z)
  }

  public resize(options: Partial<TransparentBoxOptions>) { 
    console.log('resize==>', options)
    const newW = options.width ?? this.params.width
    const newH = options.height ?? this.params.height
    const newL = options.length ?? this.params.length
    const newT = options.thickness ?? this.params.thickness

    this.params.width = newW
    this.params.height = newH
    this.params.length = newL
    this.params.thickness = newT

    const update = (mesh: THREE.Mesh, w: number, h: number, l:number ,pos?: THREE.Vector3,) => {
      // const prevQuat = mesh.quaternion.clone()
      // 更新几何体
      mesh.geometry.dispose()
      mesh.geometry = new THREE.BoxGeometry(w, h, l)
      // 保持材质并更新物理厚度（如果存在）
      const mat: any = mesh.material
      if (mat && typeof mat.thickness !== 'undefined') mat.thickness = this.params.thickness
      // mesh.material.needsUpdate = true
      // 复位/应用旋转与位置
      // console.log('rot==>', rot)
      // if (rot) mesh.rotation.copy(rot)
      // console.log('prevQuat==>', rot,prevQuat)
      // if (rot) {
      //   mesh.rotation.copy(rot)
      // } else {
      //   mesh.quaternion.copy(prevQuat)
      // }
      if (pos) mesh.position.copy(pos)
    }
    // front / back
    update(this.faces.front, newW - 2*newT, newH - newT,newT,new THREE.Vector3(0, 0, newL / 2 - newT / 2))
    update(this.faces.back, newW - newT, newH - newT, newT,new THREE.Vector3(0, 0, -newL / 2 + newT / 2))

    // top / bottom （旋转保持为 X 轴 90deg）
    update(this.faces.top, newW , newT ,newL, new THREE.Vector3(0, newH / 2, 0))
    update(this.faces.bottom, newW , newT ,newL, new THREE.Vector3(0, -newH / 2, 0))

    // left / right （旋转保持为 Y 轴 90deg）
    update(this.faces.left, newT, newH - newT, newL , new THREE.Vector3(-newW / 2 + newT /2, 0, 0))
    update(this.faces.right, newT, newH - newT, newL, new THREE.Vector3(newW / 2 - newT/2, 0, 0))
    return this
  }
  public findFlange(id:string){ 
    return this.flanges.find(item=>item.flange.getObject3D().uuid === id)
  }
  public setActiveFlange = (id:string) => {
    this.activeFlange = null
    this.flanges.forEach((item) =>{
      if(item.flange.getObject3D().uuid == id){
        this.activeFlange = item
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
    let obj = {
      drawDiameter: options?.radius ?? 0.12,
      actucalDiameter: options?.radius ?? 0.12,
      length: options?.length ?? (this.params.thickness - 0.001),
    }
    obj = Object.assign(obj, options)
    let flange = new Flange(obj)
    let flangeMesh = flange.getObject3D()
    switch (faceName) {
      case 'front':
        flangeMesh.rotation.x = Math.PI / 2
        break
      case 'back':
        flangeMesh.rotation.x = -Math.PI / 2
        break
      case 'left':
        flangeMesh.rotation.z = Math.PI / 2
        break
      case 'right':
        flangeMesh.rotation.z = -Math.PI / 2
        break
      case 'bottom':
        flangeMesh.rotation.x = Math.PI
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
    this.flanges.push({flange:flange,offset:[0.5,0.5]})
    this.portList.push(port)
    this.activeFace.add(flangeMesh)
    this.setActiveFlange(flangeMesh.uuid)
    // return flangeMesh
  }

  public setOutletOffset = (offsetX: number, offsetY: number) => {
    console.log("setOutletOffset===>", offsetX, offsetY);
    if(isNaN(offsetX) || isNaN(offsetY)) return
    
    let outlet: THREE.Object3D | any = this.activeFlange!.flange.getObject3D();
    let faceMesh: THREE.Mesh | any = outlet.parent
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
      const width = this.params.width ?? 1;
      const height = this.params.length ?? 1;
      const baseX = width / 2;
      const baseY = height / 2;
      // console.log('width,height',width,height)
      outlet.position.set(offsetX -baseX,0,offsetY - baseY);
    }else if(faceMesh.name =='left' || faceMesh.name =='right'){
      const width = this.params.length  ?? 1;
      const height = this.params.height ?? 1;

      const baseX = width / 2;
      const baseY = height / 2;
      outlet.position.set(0,offsetY-baseY,offsetX-baseX);
    }else if(faceMesh.name =='front' || faceMesh.name =='back'){
      const width = this.params.width  ??1;
      const height = this.params.height ?? 1;

      const baseX = width / 2;
      const baseY = height / 2;
      outlet.position.set(offsetX-baseX,offsetY-baseY,0);
    }
    this.notifyPortsUpdated()
  }

  public delFlange (){
    disposeObject(this.activeFlange?.flange.getObject3D() as THREE.Object3D)
    this.activeFlange?.flange.getObject3D().parent?.remove(this.activeFlange.flange.getObject3D())
    this.flanges = this.flanges.filter(item=>item!=this.activeFlange)
    this.activeFlange = null
  }
  
  /**
   * 获取当前激活窗口的端口信息
   * */ 
  public getPort = () => {
    if(!this.activeFlange) return
    return this.activeFlange.flange.getPort()
  }
  notifyPortsUpdated() {
    for (const port of this.portList) {
      if(port.connected && port.isConnected){
        // console.log('port notifyPortsUpdated===>', port);
        // this.updatePortList()
        port.onParentTransformChanged();
      }
    }
  }
}





