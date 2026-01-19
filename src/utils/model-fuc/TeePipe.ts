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
import { Port } from './Port';
import { flangeBaseOptions } from '@/assets/js/modelBaseInfo';
import { materialCache } from '../three-fuc/MaterialCache';
import { BaseModel } from './BaseModel';
export interface TeePipeOptions {
  mainLength: number;      // 主通长度
  branchLength: number;    // 岔口长度
  mainDiameter: number;    // 主通内径
  branchDiameter: number;  // 岔口内径
  thickness: number;       // 管壁厚度
  color: number | string | number[]; // 颜色
  diameter: number;
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

export class TeePipe extends BaseModel {
  params!: TeePipeOptions;
  private mesh!: THREE.Mesh;
  // 保存 Worker 引用，以便在删除时清理
  private currentWorker: Worker | null = null;
  private onWorkerMessageHandler: ((e: MessageEvent) => void) | null = null;
  private onWorkerErrorHandler: ((err: any) => void) | null = null;
  
  constructor(options: any) {
    super();
    this.type = 'Tee';
    this.rotateAxis = 'X';
    let defaultObj = Object.assign(teeBaseOptions,{
      mainDiameter: options.diameter,
      branchDiameter: options.diameter,
      color: 0xa698a6,
    }); 
    let obj = {} as {mainLength:number,branchLength:number,diameter:number}
    modelSize.forEach((item) => {
      if(options.diameter === item.diameter){
        obj = Object.assign(obj,item)
      }
    })
    if(!obj.mainLength || !obj.branchLength){
      console.error('TeePipe 尺寸参数错误')
      return
    }
    this.params = Object.assign(defaultObj, obj);
    this.initBaseModel('TeePipe', { ...this.params }, options?.id || '');
    this.material = materialCache.getMeshMaterial(this.params.color);
    this.initPortList();
    this.build();  // 初始构建
  }
  private async build() {
    // 清理之前的 Worker（如果存在）
    this.cleanupWorker();

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

    this.currentWorker = new Worker(new URL('@/utils/tool/TeeWorker.ts', import.meta.url), { type: "module" });

    this.onWorkerMessageHandler = (e: MessageEvent) => {
      const loader = new THREE.ObjectLoader();
      this.mesh = loader.parse(e.data) as any;
      // 确保 material 已初始化
      if (!this.material) {
        this.material = materialCache.getMeshMaterial(this.params.color);
      }
      this.mesh.material = this.material;
      this.group.clear();
      this.clearMeshList(); // 重建时清空 meshList
      this.group.add(this.mesh);
      
      // 添加到 meshList
      this.addMesh(this.mesh);
      
      this.flanges.forEach((item:{flange:Flange,offset?:number[]}) =>{
        this.group.add(item.flange.getObject3D())
      })

      const axesHelper = new THREE.AxesHelper(0.3);
      axesHelper.raycast = function() {};
      this.group.add(axesHelper);

      this.cleanupWorker();
    }
    this.onWorkerErrorHandler = (err: any) => {
      console.error('TeeWorker error', err);
      this.cleanupWorker();
    };

    this.currentWorker.addEventListener('message', this.onWorkerMessageHandler);
    this.currentWorker.addEventListener('error', this.onWorkerErrorHandler);

    this.currentWorker.postMessage({
      mainOuter: mainOuterGeo.toJSON(),
      mainInner: mainInnerGeo.toJSON(),
      branchOuter: branchOuterGeo.toJSON(),
      branchInner: branchInnerGeo.toJSON(),
      length: branchLength
    });
  }

  // 清理 Worker 及其监听器
  private cleanupWorker() {
    if (this.currentWorker) {
      if (this.onWorkerMessageHandler) {
        this.currentWorker.removeEventListener('message', this.onWorkerMessageHandler);
        this.onWorkerMessageHandler = null;
      }
      if (this.onWorkerErrorHandler) {
        this.currentWorker.removeEventListener('error', this.onWorkerErrorHandler);
        this.onWorkerErrorHandler = null;
      }
      try {
        this.currentWorker.terminate();
      } catch (err) {
        // ignore
      }
      this.currentWorker = null;
    }
  }

  // 模型销毁时调用
  public dispose(): void {
    this.cleanupWorker();
    super.dispose();
  }

  protected createFlange(diameter: number): Flange {
    let obj = {
      ...flangeBaseOptions,
      diameter: diameter,
      drawDiameter: diameter,
      actualDiameter: diameter,
    }
    return new Flange(obj)
  }

  protected initPortList() {
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
  resetPortList(){
    // this.portList = []
    this.portList.forEach((item:Port) => {
      if(item.name == 'side') item.type = 'in'
      else item.type = 'out'
    })
    this.rotateAxis = 'Y'
  }

  public setColor(color: number = 0x005bac): void {
    this.params.color = color;
    // 使用基类的 setColor，它会自动使用 meshList
    super.setColor(color);
    // 更新材质引用
    this.material = materialCache.getMeshMaterial(color);
  }
  /** 修改主管直径 */
  setMainDiameter(d: number) {
    this.params.mainDiameter = d;
    this.build();
  }

  /** 修改岔口直径 */
  setBranchDiameter(d: number) {
    console.log('setBranchDiameter', d);
    if(d > this.params.mainDiameter){
      d = this.params.mainDiameter
    }
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
}