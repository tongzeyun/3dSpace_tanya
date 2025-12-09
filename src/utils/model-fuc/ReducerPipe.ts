/**
 * @Author: Travis
 * @Date: 2025-12-09 17:33:28
 * @Description: 自定义异径管模型
 * @LastEditTime: 2025-12-09 17:33:28
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { Port } from "./Port";
import { Flange } from "./Flange";

interface ReducerOptions {
  length?: number;
  innerStart?: number; // 起端内径
  innerEnd?: number;   // 末端内径（可动态修改）
  thickness?: number;  // 壁厚
  radialSegments?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
}

export class ReducerPipe {
  private group: THREE.Group;
  private material: THREE.MeshStandardMaterial;
  private params: Required<ReducerOptions>;
  private portList: Port[] = [];
  private activeFlange: {flange:Flange,offset?:number[]} | null = null;

  constructor(params: Partial<ReducerOptions>) {
    const defaultObj = { 
      length: 0.5, 
      innerStart: 0.2, 
      innerEnd: 0.1,
      thickness: 0.01, 
      radialSegments: 32,
      position: new THREE.Vector3(0,0,0),
      rotation: new THREE.Euler(0,0,0)
    };
    this.params = Object.assign({}, defaultObj, params);
    this.group = new THREE.Group();
    this.material = new THREE.MeshStandardMaterial({
      color: 0xd6d5e3,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.build();
  }
  private build() { 
    this.group.clear();
    let startRadius = this.params.innerStart /2;
    let endRadius = this.params.innerEnd /2;
    let thickness = this.params.thickness;
    const outerGeo = new THREE.CylinderGeometry(
      endRadius + thickness,
      startRadius + thickness,
      this.params.length,
      this.params.radialSegments,
      1,
      true
    );
    const innerGeo = new THREE.CylinderGeometry(
      endRadius,
      startRadius,
      this.params.length,
      this.params.radialSegments,
      1,
      true
    );
    innerGeo.computeVertexNormals();
    const outerMesh = new THREE.Mesh(outerGeo, this.material);
    const innerMesh = new THREE.Mesh(innerGeo, this.material);
    this.group.add(outerMesh);
    this.group.add(innerMesh);
  }
  public updateInnerEnd(newEnd: number) {
    this.params.innerEnd = newEnd;
    this.build();
  }
  public getObject3D() {
    return this.group;
  }
}