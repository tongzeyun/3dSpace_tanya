/**
 * @Author: Travis
 * @Date: 2025-12-24 16:19:01
 * @Description: 
 * @LastEditTime: 2025-12-24 16:19:01
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { loadGLBModel } from '@/utils/three-fuc/index';
import { Port } from "./Port";
import { Flange } from "./Flange";
import { fenziPumpBaseList, flangeBaseOptions } from "@/assets/js/modelBaseInfo";

export interface PumpModelParams{
  url: string;
  inOffset?: number[];
  indir:number[],
  outOffset?: number[];
  outdir:number[],
  diameter?:number;
  scale: [number,number,number];
}
export class PumpModel{
  public type = 'Pump';
  public group!: THREE.Group;
  public portList: Port[] = []
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  public id:string = String(Math.random()).slice(4)
  public params!: PumpModelParams;
  public activeFlange: {flange:Flange,offset?:number[]} | null = null
  public constructor(diameter: number,modelType:string) {
    if(modelType == '1'){
      let obj = fenziPumpBaseList.find((item)=>item.diameter === diameter) as any;
      this.params = Object.assign({},obj)
    }
    // console.log('创建阀门模型',diameter);
    this.group = new THREE.Group();
    // this.group.name = 'flange-model'
    // this.params = valveBaseList.find((item:ValveModelParams)=>item.diameter === diameter) as ValveModelParams;
    // console.log(this.params)
    
    this.buildMesh()
    this.initPortList()
  }
  private async buildMesh() { 
    this.group.clear();
    let model = await loadGLBModel(this.params.url)
    let root = model as THREE.Object3D;
    root.scale.set(...this.params.scale)
    this.group.add(root);

    const box = new THREE.Box3().setFromObject(root);
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);

    this.group.worldToLocal(worldCenter);
    root.position.sub(worldCenter);

    this.group.userData.isRoot = true;
    // this.group.userData.isRotation = true
    // this.group.userData.canInteractive = true;

    const axesHelper = new THREE.AxesHelper(1);
    axesHelper.raycast = function() {};
    this.group.add(axesHelper);

    console.log('PumpModel model===>', this.group);

    // this.params.inOffset
    if (this.params.inOffset && Array.isArray(this.params.inOffset)) {
      const inPos = new THREE.Vector3(...this.params.inOffset as number[]);
      const sphereGeom = new THREE.SphereGeometry(0.02, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const helperSphere = new THREE.Mesh(sphereGeom, sphereMat);
      helperSphere.position.copy(inPos);
      helperSphere.name = 'inOffsetHelper';
      // 禁用射线检测，避免影响选中逻辑
      helperSphere.raycast = function () {};
      this.group.add(helperSphere);
    }

  }
  public getObject3D():THREE.Group{
    return this.group
  }
  createFlange(){
    let obj = {
      ...flangeBaseOptions,
      diameter: this.params.diameter,
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
    flange1.setPort(port1)
    this.flanges.push({flange:flange1})
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
}