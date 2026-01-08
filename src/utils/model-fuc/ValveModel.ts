/**
 * @Author: Travis
 * @Date: 2025-12-18 18:12:20
 * @Description: 创建阀门模型
 * @LastEditTime: 2025-12-18 18:12:20
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { loadGLBModel } from '@/utils/three-fuc/index';
import { Port } from "./Port";
import { Flange } from "./Flange";
import { flangeBaseOptions, valveBaseList } from "@/assets/js/modelBaseInfo";

export interface ValveModelParams{
  url: string;
  inOffset?: number[];
  indir:number[],
  outOffset?: number[];
  outdir:number[],
  diameter?:number;
  scale: [number,number,number];
  rotateAxis: 'X' | 'Y' | 'Z';
}

export class ValveModel{
  public type = 'Valve';
  public group: THREE.Group;
  public portList: Port[] = []
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  public id:string = String(Math.random()).slice(4)
  public params: ValveModelParams;
  public activeFlange: {flange:Flange,offset?:number[]} | null = null;
  public rotateAxis = 'Y';
  public constructor(diameter: number) {
    console.log('创建阀门模型',diameter);
    this.group = new THREE.Group();
    this.group.name = 'flange-model'
    this.params = valveBaseList.find((item:ValveModelParams)=>item.diameter === diameter) as ValveModelParams;
    console.log(this.params)
    
    this.buildMesh()
    this.initPortList()
  }

  private async buildMesh(){
    await loadGLBModel(this.params.url).then((model)=>{
      // console.log('加载模型成功',model);
      let root = model as THREE.Object3D;
      root.scale.set(...this.params.scale)
      
      this.group.add(root);

      // const box = new THREE.Box3().setFromObject(root);
      // const worldCenter = new THREE.Vector3();
      // box.getCenter(worldCenter);

      // this.group.worldToLocal(worldCenter);
      // root.position.sub(worldCenter);

      this.group.userData.isRoot = true;
      this.group.userData.isRotation = true
      // this.group.userData.rotationAxis = this.params.rotationAxis;
      this.rotateAxis = this.params.rotateAxis;
      this.group.userData.canInteractive = true;

      // const axesHelper = new THREE.AxesHelper(1);
      // axesHelper.raycast = function() {};
      // this.group.add(axesHelper);
    })
  }

  createFlange(){
    let obj = {
      ...flangeBaseOptions,
      drawDiameter: this.params.diameter,
      actualDiameter: this.params.diameter,
    }
    return new Flange(obj)
  }
  private initPortList() {
    let port1 = new Port(
      this,
      'main',
      'in',
      new THREE.Vector3(...this.params.inOffset as number[]),
      new THREE.Vector3(...this.params.indir as number[])
    )
    this.portList.push(port1)
    let flange1 = this.createFlange()
    let flangeMesh1 = flange1.getObject3D()
    flangeMesh1.visible = false
    // this.group.add(flangeMesh1)
    // flangeMesh1.position.set(flange1.params.length/2,0,0)
    // flangeMesh1.rotation.set(0,0,Math.PI/2)
    flange1.setPort(port1)
    this.flanges.push({flange:flange1})

    // let offsetX = this.params.length-this.params.diameter/2-this.params.thickness
    // let offsetY = this.params.length-this.params.diameter/2-this.params.thickness
    let port2 = new Port(
      this,
      'main',
      'out',
      new THREE.Vector3(...this.params.outOffset as number[]),
      new THREE.Vector3(...this.params.outdir as number[])
    )
    this.portList.push(port2)
    let flange2 = this.createFlange()
    let flangeMesh2 = flange2.getObject3D()
    flangeMesh2.visible = false
    // this.group.add(flangeMesh2)
    
    // flangeMesh2.position.set(offsetX,offsetY-flange2.params.length/2,0)
    // flangeMesh2.rotation.set(0,0,Math.PI/2)
    flange2.setPort(port2)
    this.flanges.push({flange:flange2})
  }
  findFlange(_id:string){
    return this.flanges[1]
  }
  setActiveFlange = (_id:string) => {
    this.activeFlange = this.flanges[1]
  }
  getObject3D() {
    return this.group;
  }
  getPort(type:string){
    return this.portList.filter((item:Port) => item.type.includes(type))
  }
  setSeleteState(){
    this.setColor(0x005bac)
  }
  setUnseleteState(){
    this.setColor(0xd6d5e3)
  }
  setColor(color: number | string = 0x005bac){
    const col = new THREE.Color(color as any);
    const applyColorToObject = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh && (mesh as any).isMesh && (mesh as any).material) {
          const mat: any = (mesh as any).material;
          const apply = (m: any) => {
            if (!m) return;
            if (m.color) m.color.set(col);
            else if (m.emissive) m.emissive.set(col);
            if (m.needsUpdate !== undefined) m.needsUpdate = true;
          };
          if (Array.isArray(mat)) mat.forEach(apply);
          else apply(mat);
        }
      });
    };

    if (this.group) applyColorToObject(this.group);
    for (const f of this.flanges) {
      const fo = f.flange?.getObject3D();
      if (fo) applyColorToObject(fo);
    }
  }
  notifyPortsUpdated() {
    for (const port of this.portList) {
      if(port.connected && port.isConnected){
        port.onParentTransformChanged();
      }
    }
  }
}
