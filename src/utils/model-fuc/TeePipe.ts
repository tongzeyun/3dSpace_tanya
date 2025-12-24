/**
 * @Author: Travis
 * @Date: 2025-12-01 14:08:42
 * @Description: 自定义三通模型
 * @LastEditTime: 2025-12-01 14:08:42
 * @LastEditors: Travis
 */

import * as THREE from 'three';
import { Flange } from './Flange';
import { teeBaseOptions } from '@/assets/js/modelBaseInfo';
// import { CSG } from 'three-csg-ts';
// console.log(CSG)
import { Port } from './Port';
import { flangeBaseOptions } from '@/assets/js/modelBaseInfo';
export interface TeePipeOptions {
  mainLength: number;      // 主通长度
  branchLength: number;    // 岔口长度

  mainDiameter: number;    // 主通内径
  branchDiameter: number;  // 岔口内径

  thickness: number;       // 管壁厚度
  color: number | string | THREE.Color;
}

const modelSize = [
  {mainLength: 0.08, branchLength: 0.04,diameter:0.016},
  {mainLength: 0.10, branchLength: 0.05,diameter:0.025},
  {mainLength: 0.13, branchLength: 0.065,diameter:0.040},
  {mainLength: 0.176, branchLength: 0.088,diameter:0.063},
  {mainLength: 0.216, branchLength: 0.108,diameter:0.100},
  {mainLength: 0.276, branchLength: 0.138,diameter:0.160},
  {mainLength: 0.416, branchLength: 0.208,diameter:0.250},
] as {mainLength:number,branchLength:number,diameter:number}[]

export class TeePipe {
  group: THREE.Group;
  params!: TeePipeOptions;
  material!: THREE.Material;
  public portList: Port[] = [];
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  public activeFlange: {flange:Flange,offset?:number[]} | null = null;
  public type = 'Tee'
  public id:string = String(Math.random()).slice(4)
  public rotateAxis = 'X' // 控制三通旋转方式
  constructor(diameter: Number) {
    this.group = new THREE.Group();
    let defaultObj = Object.assign(teeBaseOptions,{
      mainDiameter: diameter,
      branchDiameter: diameter,
      color: 0xa698a6,
    }); 
    let obj = {} as {mainLength:number,branchLength:number,diameter:number}
    modelSize.forEach((item) => {
      if(diameter === item.diameter){
        obj = Object.assign(obj,item)
      }
    })
    if(!obj.mainLength || !obj.branchLength){
      console.error('TeePipe 尺寸参数错误')
      return
    }
    this.params = Object.assign(defaultObj, obj);
    this.group.userData = { ...this.params };
    this.portList = []
    this.material = new THREE.MeshStandardMaterial({
      color: this.params.color,
      metalness: 0.3,
      roughness: 0.4
    });
    this.initPortList()
    this.build();  // 初始构建
  }
  private async build() {
    const {
      mainLength = 0.5,
      branchLength = 0.2,
      mainDiameter = 0.1,
      branchDiameter = 0.08,
      thickness = 0.01
    } = this.params;

    const mainInnerR = mainDiameter / 2;
    const mainOuterR = mainInnerR + thickness;
    
    const branchInnerR = branchDiameter / 2;
    const branchOuterR = branchInnerR + thickness;
    

    /** 主通（水平管） */
    const mainOuterGeo = new THREE.CylinderGeometry(
      mainOuterR, mainOuterR, mainLength, 32
    );
    // mainOuterGeo.rotateZ(Math.PI / 2);

    const mainInnerGeo = new THREE.CylinderGeometry(
      mainInnerR, mainInnerR, mainLength + 1, 32
    );
    // mainInnerGeo.rotateZ(Math.PI / 2);

    /** 分管道 */
    const branchOuterGeo = new THREE.CylinderGeometry(
      branchOuterR, branchOuterR, branchLength, 32 , 1
    );

    // branchOuterGeo.translate(0, branchLength / 2, 0);

    const branchInnerGeo = new THREE.CylinderGeometry(
      branchInnerR, branchInnerR, branchLength + 1, 32
    );
    // branchInnerGeo.translate(0, branchLength / 2, 0);

    const worker = new Worker(new URL('@/utils/tool/TeeWorker.ts', import.meta.url), { type: "module" });

    const onWorkerMessage = (e: MessageEvent) => {
      const loader = new THREE.ObjectLoader();
      const finalGeometry = loader.parse(e.data);
      console.log(finalGeometry);
      (finalGeometry as any).material = this.material;
      this.group.clear();
      this.group.add(finalGeometry);
      this.flanges.forEach((item:{flange:Flange,offset?:number[]}) =>{
        this.group.add(item.flange.getObject3D())
      })

      const axesHelper = new THREE.AxesHelper(0.3);
      axesHelper.raycast = function() {};
      this.group.add(axesHelper);

      worker.removeEventListener('message', onWorkerMessage);
      worker.removeEventListener('error', onWorkerError);
      try { worker.terminate(); } catch (err) { /* ignore */ }
    }
    const onWorkerError = (err: any) => {
      console.error('TeeWorker error', err);
      worker.removeEventListener('message', onWorkerMessage);
      worker.removeEventListener('error', onWorkerError);
      try { worker.terminate(); } catch (e) { /* ignore */ }
    };

    worker.addEventListener('message', onWorkerMessage);
    worker.addEventListener('error', onWorkerError);

    worker.postMessage({
      mainOuter: mainOuterGeo.toJSON(),
      mainInner: mainInnerGeo.toJSON(),
      branchOuter: branchOuterGeo.toJSON(),
      branchInner: branchInnerGeo.toJSON(),
      length: branchLength
    });
  }

  createFlange(diameter: number){
    let obj = {
      ...flangeBaseOptions,
      diameter: diameter,
      drawDiameter: diameter,
      actualDiameter: diameter,
    }
    return new Flange(obj)
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
    let flange1 = this.createFlange(this.params.mainDiameter)
    let flangeMesh1 = flange1.getObject3D()
    // this.group.add(flangeMesh1)
    flangeMesh1.position.set(-this.params.mainLength/2+flange1.params.length/2,0,0)
    flangeMesh1.rotation.set(0,0,Math.PI/2)
    flange1.setPort(port1)
    this.portList.push(port1)
    this.flanges.push({flange:flange1})

    let port2 = new Port(
      this,
      'main',
      'out',
      new THREE.Vector3(this.params.mainLength/2,0,0),
      new THREE.Vector3(1,0,0)
    )
    this.portList.push(port2)
    let flange2 = this.createFlange(this.params.mainDiameter)
    let flangeMesh2 = flange2.getObject3D()
    // this.group.add(flangeMesh2)
    flangeMesh2.position.set(this.params.mainLength/2-flange2.params.length/2,0,0)
    flangeMesh2.rotation.set(0,0,Math.PI/2)
    flange2.setPort(port2)
    this.flanges.push({flange:flange2})
    let port3 = new Port(
      this,
      'side',
      'out',
      new THREE.Vector3(0,-this.params.branchLength,0),
      new THREE.Vector3(0,-1,0)
    )
    this.portList.push(port3)

    let flange3 = this.createFlange(this.params.branchDiameter)
    let flangeMesh3 = flange3.getObject3D()
    // this.group.add(flangeMesh3)
    flangeMesh3.position.set(0,-this.params.branchLength+flange3.params.length/2,0)
    flangeMesh3.rotation.set(0,0,0)
    flange3.setPort(port3)
    this.flanges.push({flange:flange3})
  }
  public updateFlanges(){
    console.log(this.params.branchDiameter,this.params.thickness)
    let flange = this.flanges[2].flange
    flange.params.actualDiameter = Number(this.params.branchDiameter) 
    flange.params.drawDiameter = Number(this.params.branchDiameter)
    flange.rebuild()
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
  resetPortList(){
    // this.portList = []
    this.portList.forEach((item:Port) => {
      if(item.name == 'side') item.type = 'in'
      else item.type = 'out'
    })
    this.rotateAxis = 'Y'
  }

  getObject3D(){
    return this.group
  }

  getPort(type:string){
    return this.portList.filter((item:Port) => item.type.includes(type))
  }

  setSeleteState(){
    this.setColor()
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
    console.log('setBranchDiameter', d);
    this.params.branchDiameter = d;
    this.updateFlanges()
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
    let arr = this.portList.filter((item:Port) => item.connected && item.isConnected)
    arr.forEach((item:Port) => {
      item.onParentTransformChanged()
    })
    // for (const port of this.portList) {
    //   // port.updateLocal()
    //   if(port.connected && port.isConnected){
    //     // console.log('port notifyPortsUpdated===>', port);
    //     // this.updatePortList()
    //     port.onParentTransformChanged();
    //   }
    // }
  }
}