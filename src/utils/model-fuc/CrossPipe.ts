/**
 * @Author: Travis
 * @Date: 2025-12-15 09:43:33
 * @Description: 十字四通模型
 * @LastEditTime: 2025-12-15 09:43:33
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { Port } from "./Port";
import { Flange } from "./Flange";
import { flangeBaseOptions } from "@/assets/js/modelBaseInfo";

interface CrossPipeOptions {
  lengthMain?: number; // 主管长度
  lengthBranch?: number; // 支管长度（每侧）
  innerMain?: number; // 主管内径
  innerBranch?: number; // 支管内径（所有支管相同）
  thickness?: number;
  radialSegments?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
}

export class CrossPipe {
  public type = 'CrossPipe';
  private group: THREE.Group;
  private material: THREE.MeshStandardMaterial;
  private params: Required<CrossPipeOptions>;
  public portList: Port[] = [];
  public flanges: {flange: Flange, offset?: number[]}[] = [];
  public activeFlange: {flange:Flange,offset?:number[]} | null = null;
  public rotationType = false;
  public id:string = String(Math.random()).slice(4)
  constructor(params: Partial<CrossPipeOptions>) {
    const defaults: Required<CrossPipeOptions> = {
      lengthMain: 0.6,
      lengthBranch: 0.4,
      innerMain: 0.2,
      innerBranch: 0.15,
      thickness: 0.01,
      radialSegments: 32,
      position: new THREE.Vector3(0,0,0),
      rotation: new THREE.Euler(0,0,0)
    };
    this.params = Object.assign({}, defaults, params);
    // Ensure branch inner not larger than main
    if (this.params.innerBranch > this.params.innerMain) {
      this.params.innerBranch = this.params.innerMain;
    }

    this.group = new THREE.Group();
    this.group.name = 'CrossPipe';
    this.group.userData = {...this.params};

    this.material = new THREE.MeshStandardMaterial({
      color: 0xd6d5e3,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide
    });

    this.build();
    this.initPortList();
  }

  private build() {
    this.group.clear();

    const t = this.params.thickness;
    const mainR = this.params.innerMain / 2;
    const mainOuterR = mainR + t;
    const branchR = this.params.innerBranch / 2;
    const branchOuterR = branchR + t;

    // 主管（沿 Y 轴）
    const mainGeoOuter = new THREE.CylinderGeometry(
      mainOuterR,
      mainOuterR,
      this.params.lengthMain,
      this.params.radialSegments,
      1,
      true
    );
    const mainGeoInner = new THREE.CylinderGeometry(
      mainR,
      mainR,
      this.params.lengthMain,
      this.params.radialSegments,
      1,
      true
    );
    const mainOuter = new THREE.Mesh(mainGeoOuter, this.material);
    const mainInner = new THREE.Mesh(mainGeoInner, this.material);
    this.group.add(mainOuter, mainInner);

    // 支管（沿 X 轴） - 左右两侧共用一根长圆柱，通过位置覆盖
    const branchLen = this.params.lengthBranch;
    const branchGeoOuter = new THREE.CylinderGeometry(
      branchOuterR,
      branchOuterR,
      branchLen,
      this.params.radialSegments,
      1,
      true
    );
    const branchGeoInner = new THREE.CylinderGeometry(
      branchR,
      branchR,
      branchLen,
      this.params.radialSegments,
      1,
      true
    );
    // 旋转为 X 轴
    branchGeoOuter.rotateZ(Math.PI / 2);
    branchGeoInner.rotateZ(Math.PI / 2);

    const branchOuter = new THREE.Mesh(branchGeoOuter, this.material);
    const branchInner = new THREE.Mesh(branchGeoInner, this.material);
    this.group.add(branchOuter, branchInner);

    // 端盖（环形）: 上下左右 4 个
    const halfMain = this.params.lengthMain / 2;
    const halfBranch = branchLen / 2;

    const topCap = this.createRingCap(mainR, mainOuterR, halfMain);
    const bottomCap = this.createRingCap(mainR, mainOuterR, -halfMain);
    const rightCap = this.createRingCap(branchR, branchOuterR, halfBranch, 'x');
    const leftCap = this.createRingCap(branchR, branchOuterR, -halfBranch, 'x');

    this.group.add(topCap, bottomCap, rightCap, leftCap);

    // 法兰（初始附着在四端）
    if (this.flanges.length) {
      this.flanges.forEach(item => this.group.add(item.flange.getObject3D()));
    }

    // const axes = new THREE.AxesHelper(0.35);
    // axes.raycast = function() {};
    // this.group.add(axes);
  }

  private createRingCap(inner: number, outer: number, yOrZ: number, axis: 'y'|'x' = 'y') {
    const ringGeo = new THREE.RingGeometry(inner, outer, this.params.radialSegments);
    // 默认在 XZ 平面朝 +Z，调整到对应轴
    if (axis === 'y') {
      ringGeo.rotateX(-Math.PI / 2);
      ringGeo.translate(0, yOrZ, 0);
    } else {
      // axis x: 旋转为朝 +X
      ringGeo.rotateY(Math.PI / 2);
      ringGeo.translate(yOrZ, 0, 0);
    }
    return new THREE.Mesh(ringGeo, this.material);
  }

  /**
   * 设置支管内径（所有支管统一），若传入值大于主管内径则被限制为主管内径
   */
  public setBranchDiameter(newInner: number) {
    console.log('setBranchDiameter', newInner);
    if (newInner > this.params.innerMain) {
      newInner = this.params.innerMain;
    }
    this.params.innerBranch = newInner;
    this.build();
    // this.updateFlanges();
  }

  /**
   * 设置主管内径；若主管变小，自动将支管内径下调至不超过主管
   */
  public updateMainInner(newInner: number) {
    this.params.innerMain = newInner;
    if (this.params.innerBranch > newInner) {
      this.params.innerBranch = newInner;
    }
    this.build();
    // this.updateFlanges();
  }

  // private updateFlanges() {
  //   // 同步四个法兰直径
  //   this.flanges.forEach((item, idx) => {
  //     // 前两个为主上下（以此约定），后两个为左右支管
  //     const isMain = idx === 0 || idx === 1;
  //     const inner = isMain ? this.params.innerMain : this.params.innerBranch;
  //     item.flange.params.diameter = Number(inner) + Number(this.params.thickness) * 2;
  //     item.flange.rebuild && item.flange.rebuild();
  //   });
  // }

  createFlange(diameter: number) {
    let obj = {
      ...flangeBaseOptions,
      diameter: diameter,
    }
    return new Flange(obj);
  }

  private initPortList() {
    // 清理
    // this.portList = [];
    // this.flanges = [];

    const halfMain = this.params.lengthMain / 2;
    const halfBranch = this.params.lengthBranch / 2;

    // Top (主管 +Y)
    const portTop = new Port(this, 'main', 'in', new THREE.Vector3(0, halfMain, 0), new THREE.Vector3(0,1,0));
    const flangeTop = this.createFlange(this.params.innerMain);
    const fmTop = flangeTop.getObject3D();
    fmTop.position.set(0, halfMain - flangeTop.params.length/2, 0);
    flangeTop.setPort(portTop);
    this.group.add(fmTop);
    this.portList.push(portTop);
    this.flanges.push({flange: flangeTop});

    // Bottom (主管 -Y)
    const portBottom = new Port(this, 'main', 'out', new THREE.Vector3(0, -halfMain, 0), new THREE.Vector3(0,-1,0));
    const flangeBottom = this.createFlange(this.params.innerMain);
    const fmBottom = flangeBottom.getObject3D();
    fmBottom.position.set(0, -halfMain + flangeBottom.params.length/2, 0);
    flangeBottom.setPort(portBottom);
    this.group.add(fmBottom);
    this.portList.push(portBottom);
    this.flanges.push({flange: flangeBottom});

    // Right (支管 +X)
    const portRight = new Port(this, 'branch', 'out', new THREE.Vector3(halfBranch, 0, 0), new THREE.Vector3(1,0,0));
    const flangeRight = this.createFlange(this.params.innerBranch);
    const fmRight = flangeRight.getObject3D();
    fmRight.rotation.set(0,0,Math.PI/2);
    fmRight.position.set(this.params.lengthBranch/2-flangeRight.params.length/2, 0, 0);
    flangeRight.setPort(portRight);
    this.group.add(fmRight);
    this.portList.push(portRight);
    this.flanges.push({flange: flangeRight});

    // Left (支管 -X)
    const portLeft = new Port(this, 'branch', 'out', new THREE.Vector3(-halfBranch, 0, 0), new THREE.Vector3(-1,0,0));
    const flangeLeft = this.createFlange(this.params.innerBranch);
    const fmLeft = flangeLeft.getObject3D();
    fmLeft.rotation.set(0,0,Math.PI/2);
    fmLeft.position.set(-this.params.lengthBranch/2+flangeLeft.params.length/2, 0, 0);
    flangeLeft.setPort(portLeft);
    this.group.add(fmLeft);
    this.portList.push(portLeft);
    this.flanges.push({flange: flangeLeft});
  }

  public findFlange(id:string){
    return this.flanges.find(item=>item.flange.getObject3D().uuid === id);
  }

  public resetPortList(){
    this.portList.forEach((item:Port,index:number) => {
      if(index === 2){
        item.type = 'in'
      }else item.type = 'out'
    })
    this.rotationType = true
  }

  public setActiveFlange = (id:string) => {
    this.activeFlange = null;
    this.flanges.forEach((item) =>{
      if(item.flange.getObject3D().uuid == id){
        this.activeFlange = item;
        this.activeFlange.flange.setColor('#42b883');
      }else{
        item.flange.setColor('#d6d5e3');
      }
    });
  }

  setSeleteState(){ this.setColor(); }
  setUnseleteState(){ this.setColor(0xd6d5e3); }
  setColor(color: number | string = 0x005bac){
    if (this.material && (this.material as any).color) {
      (this.material as any).color = new THREE.Color(color as any);
      (this.material as any).needsUpdate = true;
    }
  }

  public getObject3D() { return this.group; }

  getPort(type:string){
    return this.portList.filter((item:Port) => item.type.includes(type));
  }

  notifyPortsUpdated() {
    for (const port of this.portList) {
      if(port.connected && port.isConnected){
        port.onParentTransformChanged();
      }
    }
  }
}
