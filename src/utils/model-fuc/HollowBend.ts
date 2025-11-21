/**
 * @Author: Travis
 * @Date: 2025-11-20 09:27:32
 * @Description: 自定义弯管模型
 * @LastEditTime: 2025-11-20 09:27:32
 * @LastEditors: Travis
 */

import * as THREE from "three";

class ArcPath extends THREE.Curve<THREE.Vector3> {
  center: THREE.Vector3;
  R: number;
  thetaStart: number;
  deltaTheta: number; // radians

  constructor(R: number, thetaStart: number, deltaTheta: number) {
    super();
    this.center = new THREE.Vector3(0, 0, 0);
    this.R = R;
    this.thetaStart = thetaStart;
    this.deltaTheta = deltaTheta;
  }

  getPoint(t: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    const target = optionalTarget || new THREE.Vector3();
    const theta = this.thetaStart + t * this.deltaTheta;
    target.set(
      this.center.x + this.R * Math.cos(theta),
      this.center.y + this.R * Math.sin(theta),
      0
    );
    return target;
  }
  // getPoint(t: number) {
  //   const theta = this.thetaStart + this.deltaTheta * t;
  //   return new THREE.Vector3(
  //     this.R * Math.cos(theta),
  //     0,
  //     this.R * Math.sin(theta)  // 放到 Z 平面
  //   );
  // }

  // 计算弧末端点和末端切线方向（方便外部使用）
  getArcEnd(): { end: THREE.Vector3; tangent: THREE.Vector3 } {
    const thetaEnd = this.thetaStart + this.deltaTheta;
    const end = new THREE.Vector3(
      this.center.x + this.R * Math.cos(thetaEnd),
      this.center.y + this.R * Math.sin(thetaEnd),
      0
    );
    // 切线方向（沿增大 theta 的方向）
    const tx = -Math.sin(thetaEnd);
    const ty = Math.cos(thetaEnd);
    const tangent = new THREE.Vector3(tx, ty, 0).normalize();
    return { end, tangent };
  }

  getArcStart(): { start: THREE.Vector3; tangent: THREE.Vector3 } {
    const theta = this.thetaStart;
    const start = new THREE.Vector3(
      this.center.x + this.R * Math.cos(theta),
      this.center.y + this.R * Math.sin(theta),
      0
    );
    const tx = -Math.sin(theta);
    const ty = Math.cos(theta);
    const tangent = new THREE.Vector3(tx, ty, 0).normalize();
    return { start, tangent };
  }
}

export interface BentPipeParams {
  outerRadius?: number; // 管外直径（截面直径）
  thickness?: number; // 壁厚
  bendRadius?: number; // 圆弧半径（圆心到管中心线）
  bendAngleDeg?: number; // 弯角（度数），即两个端点切线夹角
  thetaStartDeg?: number; // 弧的起始角（度），默认 -90deg 保持与之前风格一致
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
  private path!: ArcPath;

  constructor(params: BentPipeParams = {}) {
    const defaults = {
      outerRadius: 0.1,
      thickness: 0.01,
      bendRadius: 0.5,
      bendAngleDeg: 90,
      thetaStartDeg: 90,
      tubularSegments: 200,
      radialSegments: 48,
      color: 0x9a9a9a,
      id: String(Math.random()).slice(4),
    };
    this.params = Object.assign({}, defaults, params);
    this.group = new THREE.Group();
    this.group.userData = { id: this.params.id };
    
    this.buildMeshes();
  }

  private buildMeshes() {
    // 清除旧节点
    this.group.clear();

    const p = this.params;
    const angleRad = THREE.MathUtils.degToRad(p.bendAngleDeg);
    const thetaStart = THREE.MathUtils.degToRad(p.thetaStartDeg);
    this.path = new ArcPath(p.bendRadius, thetaStart, angleRad);
    console.log('HollowBend path===>', this.path);

    const R = p.outerRadius / 2;

    const outerGeo = new THREE.TubeGeometry(
      this.path,
      Math.max(8, Math.floor(p.tubularSegments)),
      R,
      p.radialSegments,
      false
    );
    console.log('HollowBend outerGeo===>', outerGeo.attributes.position);
    const innerRadius = Math.max(0.001, R - p.thickness);
    const innerGeo = new THREE.TubeGeometry(
      this.path,
      Math.max(8, Math.floor(p.tubularSegments)),
      innerRadius,
      p.radialSegments,
      false
    );
    
    const outerMat = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.BackSide,
    });

    this.outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);

    this.outerMesh.castShadow = true;
    this.outerMesh.receiveShadow = true;
    this.innerMesh.castShadow = false;
    this.innerMesh.receiveShadow = false;

    // this.outerMesh.add(new THREE.AxesHelper(0.3));
    // this.innerMesh.add(new THREE.AxesHelper(0.3));
    console.log(this.group.rotation, this.outerMesh.rotation, this.innerMesh.rotation)
    this.group.add(this.outerMesh);
    this.group.add(this.innerMesh);
    // this.group.add(new THREE.AxesHelper(0.3))

    const makeFrameHelperAt = (t: number, size = 0.2) => {
      // 切线
      const tangent = this.path.getTangent(t).clone().normalize();

      // 选一个参考向量（避免与切线平行）
      const tmp = new THREE.Vector3(0, 1, 0);
      if (Math.abs(tangent.dot(tmp)) > 0.999) tmp.set(1, 0, 0);

      // 计算 binormal, normal （正交基）
      const binormal = new THREE.Vector3().crossVectors(tangent, tmp).normalize();
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      // 构造基矩阵：列向量可按需安排 (X, Y, Z) 映射到 (normal, binormal, tangent)
      const basis = new THREE.Matrix4();
      basis.makeBasis(normal, binormal, tangent); // normal->X, binormal->Y, tangent->Z

      // 从矩阵得到 quaternion
      const pos = this.path.getPoint(t); // world pos of this point on path (ArcPath 以 world 为基)
      const quat = new THREE.Quaternion();
      basis.decompose(new THREE.Vector3(), quat, new THREE.Vector3());

      // 创建 helper（不挂到 outerMesh，而是挂到 scene）
      const helper = new THREE.AxesHelper(size);
      helper.position.copy(pos);
      helper.quaternion.copy(quat);
      this.group.add(helper);

      return helper;
    }

    // 调用例子：在 t = 0 处显示 Frenet frame
    // makeFrameHelperAt.call({ path: this.path }, 0, 0.2);
  }
  
  getObject3d() {
    return this.group;
  }

  // 修改弯角（度），会重建几何
  setBendAngle(angleDeg: number) {
    this.params.bendAngleDeg = angleDeg;
    this.buildMeshes();
  }

  // 以指定端点的管轴（切线方向）为旋转轴，pipeIndex: 0=start, 1=end
  rotateAroundPipeAxis(pipeIndex: 0 | 1, angleRad: number) {
    // 轴线通过端点，方向为端点切线
    if (!this.path) return;
    let axis: THREE.Vector3;
    let point: THREE.Vector3;
    if (pipeIndex === 0) {
      const s = this.path.getArcStart();
      point = s.start.clone();
      axis = s.tangent.clone().normalize();
    } else {
      const e = this.path.getArcEnd();
      point = e.end.clone();
      axis = e.tangent.clone().normalize();
    }
    this._rotateAroundWorldAxisThroughPoint(axis, point, angleRad);
  }

  private _rotateAroundWorldAxisThroughPoint(axis: THREE.Vector3, point: THREE.Vector3, angle: number) {
    // 将 group 以世界空间 point 为中心旋转
    this.group.position.sub(point);
    this.group.rotateOnWorldAxis(axis, angle);
    this.group.position.add(point);
  }

  setPosition(x = 0, y = 0, z = 0) {
    this.group.position.set(x, y, z);
  }

  dispose() {
    [this.outerMesh, this.innerMesh].forEach((m) => {
      if (!m) return;
      try {
        m.geometry.dispose();
      } catch (e) {}
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        try {
          m.material.dispose();
        } catch (e) {}
      }
    });
  }
}

export default HollowBend;