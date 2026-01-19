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
import { BaseModel } from "./BaseModel";

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

export class ValveModel extends BaseModel {
  public params: ValveModelParams;
  
  public constructor(diameter: number) {
    super();
    this.type = 'Valve';
    this.rotateAxis = 'Y';
    
    console.log('创建阀门模型', diameter);
    this.params = valveBaseList.find((item: ValveModelParams) => item.diameter === diameter) as ValveModelParams;
    if (!this.params || !Object.keys(this.params).length) return;
    
    this.initBaseModel('ValveModel');
    this.buildMesh();
    this.initPortList();
  }

  private async buildMesh() {
    await loadGLBModel(this.params.url).then((model) => {
      this.group.clear();
      this.clearMeshList(); // 重建时清空 meshList
      
      let root = model as THREE.Object3D;
      root.scale.set(...this.params.scale);
      
      this.group.add(root);

      // 收集所有 mesh 到 meshList (GLB 模型可能包含多个 mesh)
      root.traverse((child: any) => {
        if (child && (child as any).isMesh) {
          this.addMesh(child as THREE.Mesh);
        }
      });

      this.group.userData.isRoot = true;
      this.group.userData.isRotation = true;
      this.rotateAxis = this.params.rotateAxis;
      this.group.userData.canInteractive = true;
    });
  }

  protected createFlange(): Flange {
    let obj = {
      ...flangeBaseOptions,
      drawDiameter: this.params.diameter,
      actualDiameter: this.params.diameter,
    }
    return new Flange(obj);
  }

  protected initPortList() {
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
  public findFlange(_id: string) {
    return this.flanges[1];
  }

  public setActiveFlange = (_id: string) => {
    this.activeFlange = this.flanges[1];
  }

  public setColor(color: number | string = 0x005bac): void {
    // 使用基类的 setColor，它会自动使用 meshList
    super.setColor(color);
    // 同时处理法兰的颜色
    // const col = new THREE.Color(color as any);
    // for (const f of this.flanges) {
    //   const fo = f.flange?.getObject3D();
    //   if (fo) {
    //     fo.traverse((child) => {
    //       const mesh = child as THREE.Mesh;
    //       if (mesh && (mesh as any).isMesh && (mesh as any).material) {
    //         const mat: any = (mesh as any).material;
    //         const apply = (m: any) => {
    //           if (!m) return;
    //           if (m.color) m.color.set(col);
    //           else if (m.emissive) m.emissive.set(col);
    //           if (m.needsUpdate !== undefined) m.needsUpdate = true;
    //         };
    //         if (Array.isArray(mat)) mat.forEach(apply);
    //         else apply(mat);
    //       }
    //     });
    //   }
    // }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 调用基类的 dispose 方法进行清理
    super.dispose();
  }
}
