/**
 * @Author: Travis
 * @Date: 2025-11-20 09:27:32
 * @Description: 自定义弯管模型
 * @LastEditTime: 2025-11-20 09:27:32
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { Port } from './Port';
import { Flange } from "./Flange";
import { flangeBaseOptions } from "@/assets/js/modelBaseInfo";

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
  diameter?: number; //内径
  thickness?: number; // 壁厚
  bendRadius?: number; // 圆弧半径（圆心到管中心线）
  bendAngleDeg?: number; // 弯角（度数），即两个端点切线夹角
  thetaStartDeg?: number; // 弧的起始角（度），默认 -90deg
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
  public id:string = String(Math.random()).slice(4)
  public type = 'Bend'
  public portList: Port[] = [];
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  public activeFlange: {flange:Flange,offset?:number[]} | null = null;
  public rotateAxis = 'X'
  constructor(params: BentPipeParams = {}) {
    const defaults = {
      diameter: 0.1,
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
    this.portList = []
    this.buildMeshes();
    this.initPortList()
  }

  private buildMeshes() {
    // 清除旧节点
    this.group.clear();
    
    const p = this.params;
    const angleRad = THREE.MathUtils.degToRad(p.bendAngleDeg);
    const thetaStart = THREE.MathUtils.degToRad(p.thetaStartDeg);
    this.path = new ArcPath(p.bendRadius, thetaStart, angleRad);
    // console.log('HollowBend path===>', this.path);
    
    const R = p.diameter / 2 + this.params.thickness;
    const outerGeo = new THREE.TubeGeometry(
      this.path,
      Math.max(8, Math.floor(p.tubularSegments)),
      R,
      p.radialSegments,
      false
    );
    // console.log('HollowBend outerGeo===>', outerGeo.attributes.position);
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
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.BackSide,
    });

    this.outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);

    this.outerMesh.castShadow = true;
    this.outerMesh.receiveShadow = true;
    this.innerMesh.castShadow = false;
    this.innerMesh.receiveShadow = false;

    const s = this.path.getArcStart();
    const e = this.path.getArcEnd();
    const startPoint = s.start.clone();

    this.outerMesh.position.sub(startPoint);
    this.innerMesh.position.sub(startPoint);
    this.group.add(this.outerMesh);
    this.group.add(this.innerMesh);

    // const axesHelper = new THREE.AxesHelper(0.3);
    // axesHelper.raycast = function() {};
    // this.group.add(axesHelper);

    const capSegments = Math.max(16, p.radialSegments);
    const ringGeo = new THREE.RingGeometry(innerRadius, R, capSegments, 1);
    const capMatOuter = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide, // 双面，避免朝向问题
    });
    
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
    this.startCapMesh.position.copy( s.start.clone().sub(startPoint) );
    this.startCapMesh.quaternion.copy(qStart);
    this.group.add(this.startCapMesh);
    // 终点端盖
    this.endCapMesh = new THREE.Mesh(ringGeo.clone(), capMatOuter);
    this.endCapMesh.position.copy( e.end.clone().sub(startPoint) );
    this.endCapMesh.quaternion.copy(qEnd);
    this.group.add(this.endCapMesh);
    // this.initPortList()
  }
  
  getObject3D() {
    return this.group;
  }

  // 修改弯角，重建几何
  setBendAngle(angleDeg: number) {
    this.params.bendAngleDeg = angleDeg;
    this.buildMeshes();
    this.updateFlanges()
    this.notifyPortsUpdated()
  }

  createFlange(){
    let obj = {
      ...flangeBaseOptions,
      diameter: this.params.diameter,
    }
    return new Flange(obj)
  }
  public findFlange(id:string){ 
    return this.flanges.find(item=>item.flange.getObject3D().uuid === id)
  }
  public setActiveFlange = (id:string) => {
    this.activeFlange = null
    this.flanges.forEach((item) =>{
      if(item.flange.getObject3D().uuid == id){
        this.activeFlange = item
        this.activeFlange.flange.setColor('#42b883')
      }else{
        item.flange.setColor('#d6d5e3')
      }
    })
  }
  setPosition(x = 0, y = 0, z = 0) {
    this.group.position.set(x, y, z);
  }
  setColor(color:number = 0x005bac){
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
  setSeleteState(){
    this.setColor(0x005bac)
  }
  setUnseleteState(){
    this.setColor(0xd6d5e3)
  }
  initPortList(){
    if (!this.path) return null;
    const { start, tangent: tangent1 } = this.path.getArcStart();
    const posLocal1 = start.clone().sub(start.clone());
    const dirLocal1 = tangent1.clone().negate().normalize();
    let port1 = new Port(
      this,
      'main',
      'in',
      posLocal1,
      dirLocal1
    )
    port1.updateLocal = () => {
      const { start, tangent } = this.path.getArcStart();
      // console.log(start,tangent,this.path)
      port1.localPos = start.clone().sub(start.clone())
      port1.localDir = tangent.clone().negate().normalize()
    }
    this.portList.push(port1)
    let flange1 = this.createFlange()
    let flangeMesh1 = flange1.getObject3D()
    flange1.setPort(port1)
    this.group.add(flangeMesh1)
    flangeMesh1.position.copy(posLocal1.add(new THREE.Vector3(flange1.params.length/2,0,0)))
    const quaternion1 = new THREE.Quaternion();
    quaternion1.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirLocal1);
    const euler1 = new THREE.Euler().setFromQuaternion(quaternion1, 'XYZ');
    flangeMesh1.rotation.copy(euler1)
    this.flanges.push({flange:flange1})
    

    const { end, tangent:tangent2 } = this.path.getArcEnd();
    const posLocal2 = end.clone().sub(start.clone());
    const dirLocal2 = tangent2.clone().normalize();
    let port2 = new Port(
      this,
      'main',
      'out',
      posLocal2,
      dirLocal2
    )
    port2.updateLocal = () =>{
      const { start } = this.path.getArcStart();
      const { end, tangent } = this.path.getArcEnd();
      // console.log(end,tangent)
      port2.localPos = end.clone().sub(start.clone())
      port2.localDir = tangent.clone().normalize()
    }
    this.portList.push(port2)
    let flange2 = this.createFlange()
    let flangeMesh2 = flange2.getObject3D()
    flange2.setPort(port2)
    this.group.add(flangeMesh2)
    flangeMesh2.position.copy(posLocal2.add(new THREE.Vector3(0,-flange2.params.length/2,0)))
    const quaternion2 = new THREE.Quaternion();
    quaternion2.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirLocal2);
    const euler2 = new THREE.Euler().setFromQuaternion(quaternion2, 'XYZ');
    flangeMesh2.rotation.copy(euler2)
    this.flanges.push({flange:flange2})
  }
  updateFlanges(){
    if (!this.path) return;
    const { start, tangent: tangent1 } = this.path.getArcStart();
    const { end, tangent: tangent2 } = this.path.getArcEnd();

    // 第一法兰（起点），在 group 坐标系中 start 相当于原点(0,0,0)
    const flange1 = this.flanges[0].flange;
    const flangeMesh1 = flange1.getObject3D();
    const dir1 = tangent1.clone().normalize(); // 法兰朝外方向
    const offset1 = dir1.clone().multiplyScalar(flange1.params.length / 2);
    flangeMesh1.position.copy(offset1); // start 本地坐标为 0，所以直接用偏移
    const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1);
    flangeMesh1.quaternion.copy(q1);

    // 第二法兰（终点）
    const flange2 = this.flanges[1].flange;
    const flangeMesh2 = flange2.getObject3D();
    const dir2 = tangent2.clone().normalize();
    const posLocal2 = end.clone().sub(start.clone()); // 终点相对于 start 的局部坐标
    // 沿端口方向外移半个法兰长度（通常向外应为 -dir2 或 +dir2，取决于模型朝向）
    const offset2 = dir2.clone().multiplyScalar(-flange2.params.length / 2);
    flangeMesh2.position.copy(posLocal2.add(offset2));
    const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir2);
    flangeMesh2.quaternion.copy(q2);

    this.group.add(flangeMesh1);
    this.group.add(flangeMesh2);
  }

  getPort(type:string){
    // console.log('getPort',type)
    return this.portList.filter((item:Port) => item.type.includes(type))
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
  notifyPortsUpdated() {
    for (const port of this.portList) {
      // port.updateLocal()
      if(port.connected && port.isConnected){
        port.onParentTransformChanged();
      }
    }
  }
}

export default HollowBend;