/**
 * @Author: Travis
 * @Date: 2026-02-02 16:50:29
 * @Description: 自定义球体模型
 * @LastEditTime: 2026-02-02 16:50:29
 * @LastEditors: Travis
 */

import * as THREE from 'three'
import { Flange } from './Flange'
import { Port } from './Port'
import { disposeObject } from '../three-fuc'
const sphereBaseOptions = {
  type: 'Chamber',
  cType: '3',
  diameter: 1,
  thickness: 0.02,
  volume:1,
  isRoot: true,
  isTransform: false,
  isRotation: false,
}

export class SphereChamber{
  public type: string = 'Chamber'
  public params: Required<typeof sphereBaseOptions>
  public group: THREE.Group
  private meshList: THREE.Mesh[] = []
  public flanges: {
    flange: Flange
    // offset: { theta: number; phi: number }
    offset: [number, number]
  }[] = []
  public portList: Port[] = []
  public activeFlange: any = null
  public id: string
  public center: THREE.Vector3 = new THREE.Vector3(0,0,0)
  constructor(options: any) {
    this.params = Object.assign({}, sphereBaseOptions, options)
    this.id = options.id || String(Math.random()).slice(4)
    this.group = new THREE.Group()
    this.group.name = 'objchamber'
    this.group.userData = this.params
    this.build()
    let flangeList = options.flangeList
    if(flangeList && Array.isArray(flangeList) && flangeList?.length > 0){
      flangeList.forEach((flangeData:any) => {
        console.log('flangeData',flangeData)
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
  private build() {
    this.center = new THREE.Vector3(0,this.params.diameter,0)
    const innerR = this.params.diameter / 2
    const outerR = innerR + this.params.thickness

    const geoOuter = new THREE.SphereGeometry(outerR, 64, 32)
    const geoInner = new THREE.SphereGeometry(innerR, 64, 32)

    const matOuter = new THREE.MeshBasicMaterial({
      color: 0xd6d5e3,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide,
    })
    const matInner = new THREE.MeshBasicMaterial({
      color: 0x1334e3,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
    const outer = new THREE.Mesh(geoOuter, matOuter)
    const inner = new THREE.Mesh(geoInner, matInner)
    this.meshList.push(outer, inner)
    this.group.add(outer, inner)

    const axesHelper = new THREE.AxesHelper(innerR);
    axesHelper.raycast = function() {};
    this.group.add(axesHelper);
  }
  public getObject3D() {
    return this.group
  }
  private sphericalToCartesian(theta: number, phi: number) {
    const r = this.params.diameter / 2
    // 将度数转换为弧度
    const thetaRad = THREE.MathUtils.degToRad(theta)
    const phiRad = THREE.MathUtils.degToRad(phi)
    return new THREE.Vector3(
      r * Math.sin(phiRad) * Math.cos(thetaRad),
      r * Math.cos(phiRad),
      r * Math.sin(phiRad) * Math.sin(thetaRad)
    )
  }
  public addOutletModel(
    options:{drawDiameter?:number;actualDiameter:number;length?:number}
  ){
    let theta:number = 0;
    let phi:number = 0;
    let obj = {
      drawDiameter: options.drawDiameter ?? 0.12,
      actualDiameter: options.actualDiameter,
      length: options.length ?? this.params.thickness,
    }
    obj = Object.assign({}, obj, options)
    const flange = new Flange(obj)
    const flangeMesh = flange.getObject3D()
    const pos = this.sphericalToCartesian(theta, phi)
    flangeMesh.position.copy(pos)
    const normal = pos.clone().normalize()
    // flangeMesh.lookAt(pos.clone().add(normal))
    const zAxis = new THREE.Vector3(0, 0, 1) // 法兰默认朝向
    const quat = new THREE.Quaternion().setFromUnitVectors(zAxis, normal)
    flangeMesh.quaternion.copy(quat)
    flangeMesh.rotateX(Math.PI/2)
    let flangeInfo = flange.computedOutOffset()
    const port = new Port(
      flange,
      'main',
      'out',
      flangeInfo.pos,
      flangeInfo.dir
    )
    flange.setPort(port)
    this.group.add(flangeMesh)
    this.flanges.push({
      flange,
      offset: [theta,phi],
    })
    this.portList.push(port)
    this.setActiveFlange(flangeMesh.uuid)
  }
  public setActiveFlange(id: string) {
    this.activeFlange = null
    this.flanges.forEach((f) => {
      if (f.flange.getObject3D().uuid === id) {
        this.activeFlange = f
        f.flange.setColor('#42b883')
      } else {
        f.flange.setColor('#d6d5e3')
      }
    })
  }
  public setOutletOffset(theta: number, phi: number) {
    if (!this.activeFlange) return
    console.log('setOutletOffset===>', theta, phi);
    const flangeObj = this.activeFlange.flange.getObject3D()
    const port = this.activeFlange.flange.getPort()
    const pos = this.sphericalToCartesian(theta, phi)
    flangeObj.position.copy(pos)

    const localPos = this.sphericalToCartesian(theta, phi)
    flangeObj.position.copy(localPos)

    const normal = localPos.clone().normalize()
    const zAxis = new THREE.Vector3(0, 0, 1) // 法兰默认朝向
    const quat = new THREE.Quaternion().setFromUnitVectors(zAxis, normal)
    flangeObj.quaternion.copy(quat)
    flangeObj.rotateX(Math.PI/2)
    this.activeFlange.offset = [theta, phi]
    this.notifyPortsUpdated(port)
  }
  public setSeleteState(){
    if(!this.meshList.length) return
    this.meshList.forEach((mesh: any) => {
      try {
        // console.log(mesh.material.color)
        if (mesh && mesh.material && mesh.material.color) {
          mesh.material.color = new THREE.Color(0x72b0e6);
        }
      } catch (e) {
        console.warn('setSeleteState skip material:', e)
      }
    })
  }
  public setUnseleteState(){
    if(!this.meshList.length) return
    this.meshList.forEach((mesh: any) => {
      try {
        if (mesh && mesh.material && mesh.material.color) {
          // mesh.material.color.set(0xd6d5e3)
          mesh.material.color = new THREE.Color(0xd6d5e3);
        }
      } catch (e) {
        console.warn('setUnseleteState skip material:', e)
      }
    })
  }
  public findFlangeByUUID(id:string){ 
    return this.flanges.find(item=>item.flange.getObject3D().uuid === id)
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
    // for (const p of this.portList) {
    //   if (p.connected && p.isConnected && p.id == port.id) {
    //     p.onParentTransformChanged()
    //   }
    // }
  }

  dispose() {
    this.portList.forEach((p) => {
      if (p.connected) {
        p.connected.connected = null
        p.connected.isConnected = false
      }
    })
    disposeObject(this.group)
  }
}