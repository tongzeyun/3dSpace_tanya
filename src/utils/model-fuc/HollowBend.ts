/**
 * @Author: Travis
 * @Date: 2025-11-19 17:31:19
 * @Description: 实现弯管模型
 * @LastEditTime: 2025-11-19 17:31:19
 * @LastEditors: Travis
 */

import * as THREE from "three";

class BendPath extends THREE.Curve<THREE.Vector3> {
  L1: number;
  L2: number;
  R: number;
  thetaStart: number;
  bendAngle: number;
  arcLen: number;
  totalLen: number;
  center: THREE.Vector3;
  dirAfterArc: THREE.Vector3;
  arcEnd: THREE.Vector3;

  constructor(L1: number, R: number, bendAngle: number, L2: number) {
    super();
    this.L1 = L1;
    this.R = R;
    this.bendAngle = bendAngle; // radians
    this.L2 = L2;
    this.thetaStart = -Math.PI / 2;
    this.arcLen = Math.abs(R * bendAngle);
    this.totalLen = this.L1 + this.arcLen + this.L2;
    // center for arc as described: center at (L1, R, 0)
    this.center = new THREE.Vector3(this.L1, R, 0);
    // compute arc end and direction after arc
    const thetaEnd = this.thetaStart + this.bendAngle;
    this.arcEnd = new THREE.Vector3(
      this.center.x + R * Math.cos(thetaEnd),
      this.center.y + R * Math.sin(thetaEnd),
      0
    );
    // direction tangent at arc end
    const dx = -Math.sin(thetaEnd);
    const dy = Math.cos(thetaEnd);
    this.dirAfterArc = new THREE.Vector3(dx, dy, 0).normalize();
  }

  getPoint(t: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    const target = optionalTarget || new THREE.Vector3();
    const s = t * this.totalLen;
    if (s <= this.L1) {
      target.set(s, 0, 0);
      return target;
    }
    if (s <= this.L1 + this.arcLen) {
      const u = (s - this.L1) / this.R; // angle offset
      const theta = this.thetaStart + u;
      target.set(
        this.center.x + this.R * Math.cos(theta),
        this.center.y + this.R * Math.sin(theta),
        0
      );
      return target;
    }
    // second straight
    const rem = s - this.L1 - this.arcLen;
    target.copy(this.arcEnd).addScaledVector(this.dirAfterArc, rem);
    return target;
  }
}

export interface BentPipeParams {
  outerRadius?: number; // 管外半径
  thickness?: number; // 壁厚
  length1?: number; // 第一段直管长度
  length2?: number; // 第二段直管长度
  bendRadius?: number; // 圆弧半径（过渡半径）
  bendAngleDeg?: number; // 弯角，度
  tubularSegments?: number;
  radialSegments?: number;
  color?: number;
  id?: string;
}

export class HollowBend {
  params: Required<BentPipeParams>;
  group: THREE.Group;
  outerMesh!: THREE.Mesh;
  innerMesh!: THREE.Mesh;

  constructor(params: BentPipeParams = {}) {
    const defaults = {
      outerRadius: 0.1,
      thickness: 0.02,
      length1: 1,
      length2: 1,
      bendRadius: 0.5,
      bendAngleDeg: 45,
      tubularSegments: 200,
      radialSegments: 12,
      color: 0x9a9a9a,
      id: String(Math.random()).slice(2),
    };
    this.params = Object.assign({}, defaults, params);
    this.group = new THREE.Group();
    this.group.userData = { id: this.params.id };
    this.buildMeshes();
  }

  private buildMeshes() {
    // clear old
    this.group.clear();

    const p = this.params;
    const angleRad = THREE.MathUtils.degToRad(p.bendAngleDeg);
    const path = new BendPath(p.length1, p.bendRadius, angleRad, p.length2);

    const outerGeo = new THREE.TubeGeometry(
      path,
      Math.max(8, Math.floor(p.tubularSegments)),
      p.outerRadius,
      p.radialSegments,
      false
    );
    const innerRadius = Math.max(0.001, p.outerRadius - p.thickness);
    const innerGeo = new THREE.TubeGeometry(
      path,
      Math.max(8, Math.floor(p.tubularSegments)),
      innerRadius,
      p.radialSegments,
      false
    );

    // Outer material
    const outerMat = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.FrontSide,
    });
    // Inner material (render back faces) so interior looks hollow
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.BackSide,
    });

    this.outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);

    // enable shadows if desired
    this.outerMesh.castShadow = true;
    this.outerMesh.receiveShadow = true;
    this.innerMesh.castShadow = false;
    this.innerMesh.receiveShadow = false;

    this.group.add(this.outerMesh);
    this.group.add(this.innerMesh);
  }

  getObject3d() {
    return this.group;
  }

  setBendAngle(angleDeg: number) {
    this.params.bendAngleDeg = angleDeg;
    this.buildMeshes();
  }

  // 以指定管段轴为轴旋转整个组（pipeIndex: 0 或 1）
  rotateAroundPipeAxis(pipeIndex: 0 | 1, angleRad: number) {
    // 计算旋转轴与轴上的点（世界空间）
    // pipeIndex 0 的轴线为第一直管（从原点指向 +X），其轴线通过 (0,0,0) 方向 (1,0,0)
    // pipeIndex 1 的轴线通过 arc 末端，方向为 dirAfterArc
    const p = this.params;
    const angleRadAbs = angleRad;

    if (pipeIndex === 0) {
      const axis = new THREE.Vector3(1, 0, 0).normalize();
      const point = new THREE.Vector3(0, 0, 0);
      this._rotateAroundWorldAxisThroughPoint(axis, point, angleRadAbs);
    } else {
      // rebuild path to get arc end and direction
      const angle = THREE.MathUtils.degToRad(p.bendAngleDeg);
      const path = new BendPath(p.length1, p.bendRadius, angle, p.length2);
      // arcEnd and dirAfterArc are accessible via path fields
      const arcEnd = (path as any).arcEnd as THREE.Vector3;
      const dir = (path as any).dirAfterArc as THREE.Vector3;
      const axis = dir.clone().normalize();
      const point = arcEnd.clone();
      this._rotateAroundWorldAxisThroughPoint(axis, point, angleRadAbs);
    }
  }

  private _rotateAroundWorldAxisThroughPoint(axis: THREE.Vector3, point: THREE.Vector3, angle: number) {
    // translate so point -> origin
    this.group.position.sub(point);
    // rotate group in world axis
    this.group.rotateOnWorldAxis(axis, angle);
    // translate back
    this.group.position.add(point);
  }

  setPosition(x = 0, y = 0, z = 0) {
    this.group.position.set(x, y, z);
  }

  dispose() {
    [this.outerMesh, this.innerMesh].forEach((m) => {
      if (!m) return;
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        m.material.dispose();
      }
    });
  }
}

export default HollowBend;