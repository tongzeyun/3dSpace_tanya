/**
 * @Author: Travis
 * @Date: 2025-12-01 14:08:42
 * @Description: 自定义三通模型
 * @LastEditTime: 2025-12-01 14:08:42
 * @LastEditors: Travis
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
console.log(CSG)
export interface TeePipeOptions {
  mainLength: number;      // 主通长度
  branchLength: number;    // 岔口长度

  mainDiameter: number;    // 主通直径
  branchDiameter: number;  // 岔口直径

  thickness: number;       // 管壁厚度
}

export class TeePipe {
  group: THREE.Group;
  options: Partial<TeePipeOptions>;

  constructor(options: Partial<TeePipeOptions>) {
    this.group = new THREE.Group();
    this.options = options;

    this.build();  // 初始构建
  }
  private build() {
    const {
      mainLength = 0.5,
      branchLength = 0.2,
      mainDiameter = 0.1,
      branchDiameter = 0.08,
      thickness = 0.01
    } = this.options;

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

    console.log(branchLength / 2)
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

    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.3,
      roughness: 0.4
    });

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
      (finalGeometry as any).material = material;
      this.group.clear();
      this.group.add(finalGeometry);
      this.group.add(new THREE.AxesHelper(0.3))
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

  // private addPorts() {
  //   this.group.userData.ports = {
  //     mainIn: {
  //       position: new THREE.Vector3(-this.options.mainLength / 2, 0, 0),
  //       direction: new THREE.Vector3(-1, 0, 0),
  //     },
  //     mainOut: {
  //       position: new THREE.Vector3(this.options.mainLength / 2, 0, 0),
  //       direction: new THREE.Vector3(1, 0, 0),
  //     },
  //     branch: {
  //       position: new THREE.Vector3(0, this.options.branchLength, 0),
  //       direction: new THREE.Vector3(0, 1, 0),
  //     },
  //   };
  // }

  getObject3D(){
    return this.group
  }

  /** 修改主管直径 */
  setMainDiameter(d: number) {
    this.options.mainDiameter = d;
    this.build();
  }

  /** 修改岔口直径 */
  setBranchDiameter(d: number) {
    this.options.branchDiameter = d;
    this.build();
  }

  /** 修改主管长度 */
  setMainLength(len: number) {
    this.options.mainLength = len;
    this.build();
  }

  /** 修改岔口长度 */
  setBranchLength(len: number) {
    this.options.branchLength = len;
    this.build();
  }

  /** 修改壁厚 */
  setThickness(t: number) {
    this.options.thickness = t;
    this.build();
  }
}