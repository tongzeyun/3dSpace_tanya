/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义长方体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

// 主箱体类
import * as THREE from 'three'
import { ENUM_Box_Faces } from '../enum'
import { Flange } from './Flange'
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
  id?: string | number
  faceConfigs?: Partial<Record<FaceName, FaceConfig>> // 面属性配置
}
export class TransparentBox {
  public length: number // 长度
  public width: number // 宽度
  public height: number // 高度
  public thickness: number // 厚度
  public group: THREE.Group
  public faces: Record<FaceName, THREE.Mesh>
  public flanges: Flange[]
  constructor(options: TransparentBoxOptions = {}) {
    const {
      width = 1,
      height = 1,
      length = 1,
      thickness = 0.05,
      faceConfigs = {},
    } = options

    this.width = width
    this.height = height
    this.length = length
    this.thickness = thickness

    this.group = new THREE.Group()
    this.group.userData = {...options}
    this.group.userData.id = String(Math.random()).slice(4)
    this.faces = {} as Record<FaceName, THREE.Mesh>
    this.flanges = []

    const defaultConfig: FaceConfig = { color: 0xd6d5e3, opacity: 0.4 }

    this.faces.front = this._createFace(
      this.width - 2*this.thickness,
      this.height-this.thickness,
      this.thickness,
      { ...defaultConfig, ...faceConfigs.front }
    )
    this.faces.front.position.z = this.length / 2 - this.thickness / 2
    this.faces.front.name = 'front'

    this.faces.back = this._createFace(
      this.width - 2*this.thickness,
      this.height-this.thickness,
      this.thickness,
      { ...defaultConfig, ...faceConfigs.back }
    )
    // this.faces.back.rotation.x = Math.PI
    this.faces.back.position.z = -this.length / 2 + this.thickness / 2
    this.faces.back.name = 'back'

    this.faces.top = this._createFace(
      this.width,
      this.thickness,
      this.length,
      { ...defaultConfig, ...faceConfigs.top }
    )
    // this.faces.top.rotation.x = -Math.PI / 2
    this.faces.top.position.y = this.height / 2
    this.faces.top.name = 'top'

    this.faces.bottom = this._createFace(
      this.width,
      this.thickness,
      this.length,
      { ...defaultConfig, ...faceConfigs.bottom }
    )
    // this.faces.bottom.rotation.x = Math.PI / 2
    this.faces.bottom.position.y = -this.height / 2
    this.faces.bottom.name = 'bottom'

    this.faces.left = this._createFace(
      this.thickness,
      this.height - this.thickness,
      this.length,
      
      { ...defaultConfig, ...faceConfigs.left }
    )
    // this.faces.left.rotation.y = -Math.PI / 2
    this.faces.left.position.x = -this.width / 2 + this.thickness / 2
    this.faces.left.name = 'left'

    this.faces.right = this._createFace(
      this.thickness,
      this.height- this.thickness,
      this.length ,
      { ...defaultConfig, ...faceConfigs.right }
    )
    // this.faces.right.rotation.y = Math.PI / 2
    this.faces.right.position.x = this.width / 2 - this.thickness / 2
    this.faces.right.name = 'right';

    // 添加到组
    (Object.keys(this.faces) as FaceName[]).forEach((k) => {
      this.group.add(this.faces[k] as any)
    })
  }

  private _createFace(w: number, h: number, l:number, cfg: FaceConfig): THREE.Mesh {
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
    // return new THREE.Mesh(geometry, material).add(new THREE.AxesHelper(0.5))
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

  public setSeleteState(color:number = 0x72b0e6){
    this.setFaceProperty('top', { color, opacity: 0.4 })
  }
  public setUnseleteState(){
    this.setFaceProperty('top', { color: 0xd6d5e3, opacity: 0.4 })
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
    const newW = options.width ?? this.width
    const newH = options.height ?? this.height
    const newL = options.length ?? this.length
    const newT = options.thickness ?? this.thickness

    this.width = newW
    this.height = newH
    this.length = newL
    this.thickness = newT

    const update = (mesh: THREE.Mesh, w: number, h: number, l:number ,pos?: THREE.Vector3,) => {
      // const prevQuat = mesh.quaternion.clone()
      // 更新几何体
      mesh.geometry.dispose()
      mesh.geometry = new THREE.BoxGeometry(w, h, l)
      // 保持材质并更新物理厚度（如果存在）
      const mat: any = mesh.material
      if (mat && typeof mat.thickness !== 'undefined') mat.thickness = this.thickness
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

  public addOutletModel = (faceIndex: number, options?: { radius?: number; length?: number; color?: number }) => {
    // const this.group = this.getObject3D()
    // this.group.traverse((child: THREE.Object3D) => { 
    //   if (child.name === 'outlet-model') {
    //     // console.log("child===>", child);
    //     child.parent!.remove(child)
    //     disposeObject(child)
    //   }
    // });
    let faceName = ENUM_Box_Faces[faceIndex] as FaceName
    console.log("faceName===>", faceName);
    // console.log(this.faces[faceName])
    const faceMesh: THREE.Mesh | undefined = this.faces?.[faceName]
    if (!faceMesh) {
      console.warn("face not found", faceName)
      return
    }
    let obj = {
      radius: options?.radius ?? 0.1,
      length: options?.length ?? (this.thickness -0.01),
      color: options?.color ?? 0xa395a3
    }
    obj = Object.assign(obj, options)
    let flange = new Flange(obj)
    this.flanges.push(flange)
    let flangeMesh = flange.getObject3D()
    // const radius = options?.radius ?? 0.1
    // const cylLength = options?.length ?? (this.thickness -0.01)
    // const color = options?.color ?? 0xa395a3
    // const cylGeom = new THREE.CylinderGeometry(radius, radius, cylLength, 32)
    // const cylMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    // const cylinder = new THREE.Mesh(cylGeom, cylMat)
    // cylinder.name = 'outlet-model'
    // console.log(cylinder)
    // cylinder.add(new THREE.AxesHelper(0.3))
  
    switch (faceName) {
      case 'front':
      case 'back':
        flangeMesh.rotation.x = Math.PI / 2
        break
      case 'left':
      case 'right':
        flangeMesh.rotation.z = Math.PI / 2
        break
    }
    // console.log(flangeMesh)
    // if(curModelType != '0' && faceName =='left'){
    //   cylinder.position.set(this.radius/2 - this.thickness,0,0)
    // }
    // if(curModelType == '2'){
    //   if(faceName =='top'){
    //     cylinder.position.set(0,this.radius * 0.2 - this.thickness/2,0);
    //   }else if(faceName =='bottom'){
    //     cylinder.position.set(0,-this.radius * 0.2 + this.thickness/2,0);
    //   }
    // }
    faceMesh.add(flangeMesh)
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
    if(faceMesh.name =='top' || faceMesh.name =='bottom'){
      const width = this.width ?? 1;
      const height = this.length ?? 1;

      const baseX = width / 2;
      const baseY = height / 2;
      // console.log('width,height',width,height)
      outlet.position.set(offsetX -baseX,0,offsetY - baseY);
    }else if(faceMesh.name =='left' || faceMesh.name =='right'){
      const width = this.length  ?? 1;
      const height = this.height ?? 1;

      const baseX = width / 2;
      const baseY = height / 2;
      outlet.position.set(0,offsetY-baseY,offsetX-baseX);
    }else if(faceMesh.name =='front' || faceMesh.name =='back'){
      const width = this.width  ??1;
      const height = this.height ?? 1;

      const baseX = width / 2;
      const baseY = height / 2;
      outlet.position.set(offsetX-baseX,offsetY-baseY,0);
    }
  }
  
  public computedOutOffset = (model:THREE.Object3D) => {
    console.log(model)
    let obj = {}
    this.flanges.forEach((flang) => {
      console.log("flang===>", flang.getObject3D());
      if(flang.getObject3D().uuid == model.uuid){
        obj = flang.computedOutOffset()
      }
    })
    return obj
  }
}





