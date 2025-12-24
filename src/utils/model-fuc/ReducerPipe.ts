/**
 * @Author: Travis
 * @Date: 2025-12-09 17:33:28
 * @Description: 自定义异径管模型
 * @LastEditTime: 2025-12-09 17:33:28
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { Port } from "./Port";
import { Flange } from "./Flange";
import { flangeBaseOptions ,reducerBaseOptions } from "@/assets/js/modelBaseInfo";

interface ReducerOptions {
  length?: number;
  innerStart?: number; // 起端内径
  innerEnd?: number;   // 末端内径（可动态修改）
  thickness?: number;  // 壁厚
  radialSegments?: number;
}

export class ReducerPipe {
  private group: THREE.Group;
  private material: THREE.MeshStandardMaterial;
  private params: Required<ReducerOptions>;
  public portList: Port[] = [];
  public activeFlange: {flange:Flange,offset?:number[]} | null = null;
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  public type: string = 'Reducer';
  public id:string = String(Math.random()).slice(4)

  constructor(diameter:number) {
    const defaultObj = Object.assign(reducerBaseOptions,{ 
      length: 0.1,
      innerStart: diameter,
      innerEnd: diameter,
    });
    this.params = Object.assign({}, defaultObj);
    this.group = new THREE.Group();
    this.group.userData = {...this.params}
    this.group.name = 'Reducer';
    this.material = new THREE.MeshStandardMaterial({
      color: 0xd6d5e3,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.build();
    this.initPortList()
  }
  private build() { 
    this.group.clear();
    let startRadius = this.params.innerStart /2;
    // let endRadius = this.params.innerEnd /2;
    let thickness = this.params.thickness;
    let len = this.params.length;
    const outerGeo = new THREE.CylinderGeometry(
      startRadius + thickness,
      startRadius + thickness,
      this.params.length,
      this.params.radialSegments,
      1,
      true
    );
    const innerGeo = new THREE.CylinderGeometry(
      startRadius,
      startRadius,
      this.params.length,
      this.params.radialSegments,
      1,
      true
    );
    outerGeo.computeVertexNormals();
    const outerMesh = new THREE.Mesh(outerGeo, this.material);
    const innerMesh = new THREE.Mesh(innerGeo, this.material);
    this.group.add(innerMesh,outerMesh);

    const topCap = this.createRingCap(
      startRadius, // 内半径
      startRadius + thickness, // 外半径
      -len / 2  // y位置
    );
    const bottomCap = this.createRingCap(
      startRadius,
      startRadius + thickness,
      len / 2
    );
    this.group.add(topCap, bottomCap);
    if(this.flanges.length){
      this.flanges.forEach(item=>{
        this.group.add(item.flange.getObject3D())
      })
    }
    // const axesHelper = new THREE.AxesHelper(0.3);
    // axesHelper.raycast = function() {};
    // this.group.add(axesHelper);
  }
  private createRingCap(inner: number, outer: number, y: number) {
    const ringGeo = new THREE.RingGeometry(
      inner,
      outer,
      this.params.radialSegments
    );

    // Ring 默认朝 +Z，需要旋转为朝 +Y / -Y
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.translate(0, y, 0);

    const mesh = new THREE.Mesh(ringGeo, this.material);
    return mesh;
  }
  public updateInnerEnd(newEnd: number) {
    this.params.innerEnd = newEnd;
    this.updateFlanges()
  }
  updateFlanges(){
    let flange = this.flanges[1].flange
    flange.params.actualDiameter = Number(this.params.innerEnd)
    flange.params.drawDiameter = Number(this.params.innerStart)
    flange.params.thickness = Number(this.params.innerEnd - this.params.innerStart) / 2 + flangeBaseOptions.thickness
    flange.rebuild()
  }
  createFlange(diameter: number){
    let obj = {
      ...flangeBaseOptions,
      drawDiameter: diameter,
      actualDiameter: diameter,
    }
    return new Flange(obj)
  }
  initPortList(){
    let port1 = new Port(
      this,
      'mian',
      'in',
      new THREE.Vector3(0,-this.params.length/2,0),
      new THREE.Vector3(0,-1,0)
    )
    let flange1 = this.createFlange(this.params.innerStart)
    let flangeMesh1 = flange1.getObject3D()
    this.group.add(flangeMesh1)
    flangeMesh1.position.set(0,-this.params.length/2+flange1.params.length/2,0)
    // flangeMesh1.rotation.set(0,0,Math.PI/2)
    flange1.setPort(port1)
    this.portList.push(port1)
    this.flanges.push({flange:flange1})

    let port2 = new Port(
      this,
      'main',
      'out',
      new THREE.Vector3(0,this.params.length/2,0),
      new THREE.Vector3(0,1,0)
    )
    let flange2 = this.createFlange(this.params.innerEnd)
    let flangeMesh2 = flange2.getObject3D()
    this.group.add(flangeMesh2)
    flangeMesh2.position.set(0,this.params.length/2-flange2.params.length/2,0)
    // flangeMesh1.rotation.set(0,0,Math.PI/2)
    flange2.setPort(port2)
    this.portList.push(port2)
    this.flanges.push({flange:flange2})
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
  }
  setSeleteState(){
    this.setColor()
  }
  setUnseleteState(){
    this.setColor(0xd6d5e3)
  }
  setColor(color: number | string = 0x005bac){
    // this.params.color = color;
    if (this.material && (this.material as any).color) {
      (this.material as any).color = new THREE.Color(color as any);
      (this.material as any).needsUpdate = true;
    }
  }
  public getObject3D() {
    return this.group;
  }
  getPort(type:string){
    return this.portList.filter((item:Port) => item.type.includes(type))
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