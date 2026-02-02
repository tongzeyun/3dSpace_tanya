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
  constructor(options: any) {
    this.params = Object.assign({}, sphereBaseOptions, options)
    this.id = options.id || String(Math.random()).slice(4)
    this.group = new THREE.Group()
    this.group.name = 'objchamber'
    this.group.userData = this.params
    this.build()
  }
  private build() {
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
      side: THREE.BackSide,
    })
    const outer = new THREE.Mesh(geoOuter, matOuter)
    const inner = new THREE.Mesh(geoInner, matInner)
    this.meshList.push(outer, inner)
    this.group.add(outer, inner)
    
  }
  public getObject3D() {
    return this.group
  }
  private sphericalToCartesian(theta: number, phi: number) {
    const r = this.params.diameter / 2
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
  }
  public addOutletModel(
    options:{theta:number;phi: number;drawDiameter?:number;actualDiameter:number;length?:number}
  ){
    const flange = new Flange({
      drawDiameter: options.drawDiameter ?? 0.12,
      actualDiameter: options.actualDiameter,
      length: options.length ?? this.params.thickness,
    })
    const flangeMesh = flange.getObject3D()
    const pos = this.sphericalToCartesian(options.theta, options.phi)
    flangeMesh.position.copy(pos)
    const normal = pos.clone().normalize()
    flangeMesh.lookAt(normal.clone().multiplyScalar(2))
    flangeMesh.rotateX(Math.PI)

    const port = new Port(
      flange,
      'main',
      'out',
      pos.clone(),
      normal.clone()
    )
    flange.setPort(port)
    this.group.add(flangeMesh)
    this.flanges.push({
      flange,
      offset: [options.theta,options.phi],
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

    const flangeObj = this.activeFlange.flange.getObject3D()
    const pos = this.sphericalToCartesian(theta, phi)
    flangeObj.position.copy(pos)

    const normal = pos.clone().normalize()
    flangeObj.lookAt(normal.clone().multiplyScalar(2))
    flangeObj.rotateX(Math.PI)

    this.activeFlange.offset = [theta, phi]
    this.notifyPortsUpdated()
  }
  public setSeleteState(){
    if(!this.meshList.length) return
    this.meshList.forEach((mesh: any) => {
      try {
        console.log(mesh.material.color)
        if (mesh && mesh.material && mesh.material.color) {
          mesh.material.color = new THREE.Color(0x72b0e6);
        }
      } catch (e) {
        // 防御性处理，避免因非法颜色字符串导致整个渲染中断
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
  notifyPortsUpdated() {
    for (const port of this.portList) {
      if (port.connected && port.isConnected) {
        port.onParentTransformChanged()
      }
    }
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