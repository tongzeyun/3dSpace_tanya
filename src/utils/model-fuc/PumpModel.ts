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
import { materialCache } from '@/utils/three-fuc/MaterialCache';
import { 
  fenziPumpBaseList, 
  flangeBaseOptions, 
  ganPumpBaseList, 
  liziPumpBaseList, 
  youPumpBaseList 
} from "@/assets/js/modelBaseInfo";
import { ElMessage } from "element-plus";
import { BaseModel } from "./BaseModel";

export interface PumpModelParams{
  url: string;
  inOffset?: number[];
  indir:number[],
  outOffset?: number[];
  outdir:number[],
  diameter?:number;
  scale: [number,number,number];
  modelDir?: string;
}
export class PumpModel extends BaseModel {
  public params!: PumpModelParams;
  
  // public constructor( diameter: number, modelType: string) {
  public constructor( options: any ) {
    super();
    this.type = 'Pump';
    console.log('创建泵模型', options);
    if(options.modelType == '1' && options.diameter < 0.063){
      ElMessage.error('分子泵最小法兰直径为63mm')
      return
    }
    if(options.modelType == '2' && options.diameter < 0.040){
      ElMessage.error('离子泵最小法兰直径为40mm')
      return
    }
    this.params = Object.assign({}, options)
    if(options.modelType == '0'){
      let obj = ganPumpBaseList.find((item)=>item.diameter === options.diameter) as any;
      this.params = Object.assign({},obj)
    }else if(options.modelType == '1'){
      let obj = fenziPumpBaseList.find((item)=>item.diameter === options.diameter) as any;
      this.params = Object.assign({},obj)
    }else if(options.modelType == '2'){
      let obj = liziPumpBaseList.find((item)=>item.diameter === options.diameter) as any;
      this.params = Object.assign({},obj)
    }else if(options.modelType == '3'){
      let obj = youPumpBaseList.find((item)=>item.diameter === options.diameter) as any;
      this.params = Object.assign({},obj)
    }
    console.log(this.params);
    
    this.initBaseModel('PumpModel');
    this.buildMesh();
    this.initPortList();
  }
  private async buildMesh() { 
    this.group.clear();
    this.clearMeshList(); // 重建时清空 meshList
    
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
    
    // 收集所有 mesh 到 meshList (GLB 模型可能包含多个 mesh)
    root.traverse((child: any) => {
      if (child && (child as any).isMesh) {
        this.addMesh(child as THREE.Mesh);
      }
    });
    
    this.setUnseleteState()
    // this.group.userData.isRotation = true
    // this.group.userData.canInteractive = true;

    const axesHelper = new THREE.AxesHelper(1);
    axesHelper.raycast = function() {};
    this.group.add(axesHelper);

    console.log('PumpModel model===>', this.group);

    // this.params.inOffset
    // if (this.params.inOffset && Array.isArray(this.params.inOffset)) {
    //   const inPos = new THREE.Vector3(...this.params.inOffset as number[]);
    //   const sphereGeom = new THREE.SphereGeometry(0.02, 16, 16);
    //   const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    //   const helperSphere = new THREE.Mesh(sphereGeom, sphereMat);
    //   helperSphere.position.copy(inPos);
    //   helperSphere.name = 'inOffsetHelper';
    //   // 禁用射线检测，避免影响选中逻辑
    //   helperSphere.raycast = function () {};
    //   this.group.add(helperSphere);
    // }

  }
  protected createFlange(): Flange {
    let obj = {
      ...flangeBaseOptions,
      diameter: this.params.diameter,
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
    flange1.setPort(port1)
    this.flanges.push({flange:flange1})
  }
  public setColor(color: number | string = 0x005bac): void {
    // 使用基类的 setColor，它会自动使用 meshList
    super.setColor(color);
    // 同时处理法兰的颜色
    for (const f of this.flanges) {
      const fo = f.flange?.getObject3D();
      if (fo) {
        fo.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh && (mesh as any).isMesh) {
            (mesh as any).material = materialCache.getMeshMaterial(color);
          }
        });
      }
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 调用基类的 dispose 方法进行清理
    super.dispose();
  }
}