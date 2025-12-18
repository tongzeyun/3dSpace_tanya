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
import { valveBaseList } from "@/assets/js/modelBaseInfo";

export interface ValveModelParams{
  url: string;
  inOffset?: number[];
  outOffset?: number[];
  diameter?:number;
  scale: [number,number,number];
}

export class ValveModel{
  public type = 'Valve';
  public group: THREE.Group;
  public portList: Port[] = []
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  public id:string = String(Math.random()).slice(4)
  public params: ValveModelParams;
  public constructor(diameter: number) {
    console.log('创建阀门模型',diameter);
    this.group = new THREE.Group();
    this.params = valveBaseList.find((item:ValveModelParams)=>item.diameter === diameter) as ValveModelParams;
    console.log(this.params)
    this.buildMesh()
  }

  private async buildMesh(){
    await loadGLBModel(this.params.url).then((model)=>{
      // console.log('加载模型成功',model);
      let m = model.children[0];
      // m.scale.set(0.1,0.1,0.1)
      this.group.add(m);
      this.group.scale.set(...this.params.scale);
      const axesHelper = new THREE.AxesHelper(0.3);
      axesHelper.raycast = function() {};
      this.group.add(axesHelper);
      // console.log('阀门模型',this.group);
    })
    this.initPortList()
  }

  createFlange(){
    
    return new Flange({})
  }
  private initPortList() {
    let port1 = new Port(
      this,
      'main',
      'in',
      new THREE.Vector3(...this.params.inOffset as number[]),
      new THREE.Vector3(-1,0,0)
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
      new THREE.Vector3(...this.params.inOffset as number[]),
      new THREE.Vector3(0,1,0)
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

  getObject3D() {
    return this.group;
  }
}
