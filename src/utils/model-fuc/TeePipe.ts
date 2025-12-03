/**
 * @Author: Travis
 * @Date: 2025-12-01 14:08:42
 * @Description: 自定义三通模型
 * @LastEditTime: 2025-12-01 14:08:42
 * @LastEditors: Travis
 */

import * as THREE from 'three';
// import { CSG } from 'three-csg-ts';
// console.log(CSG)
import { Port } from './Port';
export interface TeePipeOptions {
  mainLength: number;      // 主通长度
  branchLength: number;    // 岔口长度

  mainDiameter: number;    // 主通直径
  branchDiameter: number;  // 岔口直径

  thickness: number;       // 管壁厚度
  color: number | string | THREE.Color;
}

export class TeePipe {
  group: THREE.Group;
  params: TeePipeOptions;
  material: THREE.Material;
  public portList: Port[] = [];
  public type = 'TeePipe'
  public rotationType = false
  constructor(params: Partial<TeePipeOptions>) {
    this.group = new THREE.Group();
    const defaultObj = {
      mainLength: 0.5,
      branchLength: 0.2,
      mainDiameter: 0.1,
      branchDiameter: 0.08,
      thickness: 0.01,
      color: 0xd6d5e3,
    }
    this.params = Object.assign({}, defaultObj, params);
    this.group.userData = { ...this.params };
    this.portList = []
    this.material = new THREE.MeshStandardMaterial({
      color: this.params.color,
      metalness: 0.3,
      roughness: 0.4
    }); 
    this.build();  // 初始构建
    this.initPortList()
  }
  private build() {
    const {
      mainLength = 0.5,
      branchLength = 0.2,
      mainDiameter = 0.1,
      branchDiameter = 0.08,
      thickness = 0.01
    } = this.params;

    const mainOuterR = mainDiameter / 2;
    const mainInnerR = mainOuterR - thickness;

    const branchOuterR = branchDiameter / 2;
    const branchInnerR = branchOuterR - thickness;

    /** 主通（水平管） */
    const mainOuterGeo = new THREE.CylinderGeometry(
      mainOuterR, mainOuterR, mainLength, 32
    );
    mainOuterGeo.rotateZ(Math.PI / 2);

    const mainInnerGeo = new THREE.CylinderGeometry(
      mainInnerR, mainInnerR, mainLength + 2, 32
    );
    mainInnerGeo.rotateZ(Math.PI / 2);

    // const mainCSG = CSG.subtract(
    //   new THREE.Mesh(mainOuterGeo),
    //   new THREE.Mesh(mainInnerGeo)
    // );
    // const mainOuterMesh = new THREE.Mesh(mainOuterGeo);
    // const mainInnerMesh = new THREE.Mesh(mainInnerGeo);
    // console.log(mainOuterMesh,mainInnerMesh)
    // console.log((CSG as any).fromMesh(mainInnerMesh))
    // console.log((CSG as any).fromMesh(mainOuterMesh))
    
    // const mainCSG = CSG.subtract(
    //   new THREE.Mesh(mainOuterGeo),
    //   new THREE.Mesh(mainInnerGeo)
    // );

    // console.log(branchLength / 2)
    /** ---------- 岔口（竖直管） ---------- */
    const branchOuterGeo = new THREE.CylinderGeometry(
      branchOuterR, branchOuterR, branchLength, 32
    );

    branchOuterGeo.translate(0, branchLength / 2, 0);

    const branchInnerGeo = new THREE.CylinderGeometry(
      branchInnerR, branchInnerR, branchLength + 2, 32
    );
    branchInnerGeo.translate(0, branchLength / 2, 0);

    // const branchCSG = CSG.subtract(
    //   new THREE.Mesh(branchOuterGeo),
    //   new THREE.Mesh(branchInnerGeo)
    // );

    // const material = new THREE.MeshStandardMaterial({
    //   color: this.params.color,
    //   metalness: 0.3,
    //   roughness: 0.4
    // });

    const worker = new Worker(new URL('@/utils/tool/TeeWorker.ts', import.meta.url), { type: "module" });

    worker.postMessage({
      mainOuter: mainOuterGeo.toJSON(),
      mainInner: mainInnerGeo.toJSON(),
      branchOuter: branchOuterGeo.toJSON(),
      branchInner: branchInnerGeo.toJSON(),
      length: branchLength
    });

    worker.onmessage = (e) => {
      console.log(e.data)
      const loader = new THREE.ObjectLoader();
      const finalGeometry = loader.parse(e.data);
      console.log(finalGeometry);
      (finalGeometry as any).material = this.material;
      this.group.clear();
      this.group.add(finalGeometry);
      const axesHelper = new THREE.AxesHelper(0.3);
      axesHelper.raycast = function() {};
      this.group.add(axesHelper);
    };
    /** ---------- 组合 T 管 ---------- */
    // const finalCSG = CSG.union(mainCSG, branchCSG);
    // // const mesh = CSG.toMesh(finalCSG, new THREE.Matrix4(), material);
    // (finalCSG as any).material = material;
    // console.log(finalCSG);
    // this.group.clear();
    // this.group.add(finalCSG)
    // this.group.add(new THREE.AxesHelper(0.3))
    // this.group.add(mesh)
    // const mesh = CSG.toMesh(finalCSG, new THREE.Matrix4(), material);

    // this.group.clear();
    // this.group.add(mesh);

    /** 可选：添加可用于连接 pipe 的 port 信息 */
    // this.addPorts();
  }

  private initPortList() {
    // Port
    let port1 = new Port(
      this,
      'main',
      'in',
      new THREE.Vector3(-this.params.mainLength/2,0,0),
      new THREE.Vector3(-1,0,0)
    )
    this.portList.push(port1)
    let port2 = new Port(
      this,
      'main',
      'out',
      new THREE.Vector3(this.params.mainLength/2,0,0),
      new THREE.Vector3(1,0,0)
    )
    this.portList.push(port2)
    let port3 = new Port(
      this,
      'side',
      'out',
      new THREE.Vector3(0,-this.params.branchLength,0),
      new THREE.Vector3(0,-1,0)
    )
    port3.updateLocal = () =>{
      // port1.localPos = new THREE.Vector3(0,-this.params.length/2,0)
      // port1.localDir = new THREE.Vector3(0,-1,0)
      // console.log(port1)
    }
    this.portList.push(port3)
    this.rotationType = false
  }

  resetPortList(){
    // this.portList = []
    this.portList.forEach((item:Port) => {
      if(item.name == 'side') item.type = 'in'
      else item.type = 'out'
    })
    this.rotationType = true
  }

  getObject3D(){
    return this.group
  }

  getPort(type:string){
    return this.portList.filter((item:Port) => item.type.includes(type))
  }

  updatePortList (){
    // this.portList.forEach((item:Port) => {
    //   item.updateLocal()
    // })
  }

  setSeleteState(color:number = 0x005bac){
    this.setColor(color)
  }
  setUnseleteState(){
    this.setColor(0xd6d5e3)
  }
  setColor(color:number = 0x005bac){
    this.params.color = color;
    if (this.material && (this.material as any).color) {
      (this.material as any).color = new THREE.Color(color as any);
      (this.material as any).needsUpdate = true;
    }
  }
  /** 修改主管直径 */
  setMainDiameter(d: number) {
    this.params.mainDiameter = d;
    this.build();
  }

  /** 修改岔口直径 */
  setBranchDiameter(d: number) {
    this.params.branchDiameter = d;
    this.build();
  }

  /** 修改主管长度 */
  setMainLength(len: number) {
    this.params.mainLength = len;
    this.build();
  }

  /** 修改岔口长度 */
  setBranchLength(len: number) {
    this.params.branchLength = len;
    this.build();
  }

  /** 修改壁厚 */
  setThickness(t: number) {
    this.params.thickness = t;
    this.build();
  }
  notifyPortsUpdated() {
    for (const port of this.portList) {
      // port.updateLocal()
      if(port.connected && port.type.includes('out')){
        // console.log('port notifyPortsUpdated===>', port);
        // this.updatePortList()
        port.onParentTransformChanged();
      }
    }
  }
}