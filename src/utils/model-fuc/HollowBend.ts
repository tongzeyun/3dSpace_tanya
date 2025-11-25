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
  // id?: string;
}

export class HollowBend {
  params: Required<BentPipeParams>;
  group: THREE.Group;
  outerMesh!: THREE.Mesh;
  innerMesh!: THREE.Mesh;
  private path!: ArcPath;
  private startCapMesh?: THREE.Mesh; // 开口端封口圆环
  private endCapMesh?: THREE.Mesh; // 出口段封口圆环
  public id: string
  public type = 'Bend'
  constructor(params: BentPipeParams = {}) {
    const defaults = {
      outerRadius: 0.1,
      thickness: 0.01,
      bendRadius: 0.5,
      bendAngleDeg: 90,
      thetaStartDeg: -90,
      tubularSegments: 200,
      radialSegments: 48,
      color: 0x9a9a9a,
    };
    this.params = Object.assign({}, defaults, params);
    this.group = new THREE.Group();
    this.group.userData = { ...this.params };
    this.group.name = 'Bend'
    this.id = String(Math.random()).slice(4)
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
      color: p.color,
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
    // console.log(this.group.rotation, this.outerMesh.rotation, this.innerMesh.rotation)
    this.group.add(this.outerMesh);
    this.group.add(this.innerMesh);
    const axesHelper = new THREE.AxesHelper(0.3);
    axesHelper.raycast = function() {}; // 关键代码
    this.group.add(axesHelper);
    // this.group.add(new THREE.AxesHelper(0.3))

    const capSegments = Math.max(8, p.radialSegments);
    const ringGeo = new THREE.RingGeometry(innerRadius, R, capSegments, 1);
    const capMatOuter = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide, // 双面，避免朝向问题
    });
    const s = this.path.getArcStart();
    const e = this.path.getArcEnd();
    const qStart = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      s.tangent.clone().normalize()
    );
    const qEnd = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      e.tangent.clone().normalize()
    );
    // 起点端盖
    this.startCapMesh = new THREE.Mesh(ringGeo.clone(), capMatOuter);
    this.startCapMesh.position.copy(s.start);
    this.startCapMesh.quaternion.copy(qStart);
    this.group.add(this.startCapMesh);
    // 终点端盖
    this.endCapMesh = new THREE.Mesh(ringGeo.clone(), capMatOuter);
    this.endCapMesh.position.copy(e.end);
    this.endCapMesh.quaternion.copy(qEnd);
    this.group.add(this.endCapMesh);
  }
  
  getObject3D() {
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
  setSeleteState(color:number = 0x005bac){
    this.params.color = color;
    if (this.group) this.group.userData = { ...this.params };

    const applyColorToMesh = (mesh?: THREE.Mesh) => {
      if (!mesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat: any) => {
        if (mat && mat.color && typeof mat.color.set === "function") {
          mat.color.set(color);
        }
      });
    };

    applyColorToMesh(this.outerMesh);
    applyColorToMesh(this.innerMesh);
    applyColorToMesh(this.startCapMesh);
    // applyColorToMesh(this.endCapMesh);
  }
  computedInOffset(){
    if (!this.path) return null;

    const { start, tangent } = this.path.getArcStart();
    const posLocal = start.clone();
    const dirLocal = tangent.clone().negate().normalize();

    // 局部转世界：位置
    // const worldPos = start.clone().applyMatrix4(this.group.matrixWorld);

    // // 切线也需要转到世界坐标系（使用旋转）
    // const worldDir = tangent.clone().applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));

    // return {
    //   pos: worldPos,
    //   dir: worldDir.normalize(),
    // };
    return{
      pos: posLocal,
      dir: dirLocal,
    }
  }
  computedOutOffset(){
    if (!this.path) return null;

    const { end, tangent } = this.path.getArcEnd();

    const posLocal = end.clone();
    const dirLocal = tangent.clone().normalize();

    // const worldPos = end.clone().applyMatrix4(this.group.matrixWorld);

    // const worldDir = tangent.clone().applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));

    // return {
    //   pos: worldPos,
    //   dir: worldDir.normalize(),
    // };
    return{
      pos: posLocal,
      dir: dirLocal,
    }
  }
  dispose() {
    [this.outerMesh, this.innerMesh,this.startCapMesh, this.endCapMesh].forEach((m) => {
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