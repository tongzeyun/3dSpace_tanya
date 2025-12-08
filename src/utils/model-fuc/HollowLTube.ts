import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { Port } from "./Port";

export interface HollowLTubeOptions{
  length: number;
  innerRadius: number;
  thickness: number;
}

export class HollowLTube {
  public group: THREE.Group;
  private length: number;
  private innerRadius: number;
  private thickness: number;
  public portList: Port[] = []

  constructor(options: Partial<HollowLTubeOptions>){
    const defaults : HollowLTubeOptions = {
      length: 0.4,
      innerRadius: 0.05,
      thickness: 0.005,
    }
    const opts = {...defaults, ...options};
    this.length = opts.length;
    this.innerRadius = opts.innerRadius;
    this.thickness = opts.thickness;
    this.group = new THREE.Group()
    this.group.name = 'HollowLTube';
    this.buildMesh()
    this.initPortList()
  }

  private createHollowCylinder() {
    let outerR = this.innerRadius + this.thickness;
    let innerR = this.innerRadius
    let length = this.length
    let radialSegs = 32
    // CylinderGeometry 默认沿 Y 轴，我们先生成再旋转到 X 或 Z 轴时再使用旋转 transform
    const outerGeo = new THREE.CylinderGeometry(outerR, outerR, length, radialSegs, 1, false);
    const innerGeo = new THREE.CylinderGeometry(innerR, innerR, length + 0.02, radialSegs, 1, false);
    // 微微延长 innerGeo (length + eps) 防止布尔误差留下薄壁
    const outerMesh = new THREE.Mesh(outerGeo);
    const innerMesh = new THREE.Mesh(innerGeo);

    // 把 innerMesh 转为 same transform（位置、旋转）与 outer 相同
    innerMesh.position.copy(outerMesh.position);
    innerMesh.rotation.copy(outerMesh.rotation);

    // 使用 CSG： hollow = outer - inner
    const outerCSG = CSG.fromMesh(outerMesh);
    const innerCSG = CSG.fromMesh(innerMesh);
    const hollowCSG = outerCSG.subtract(innerCSG);
    const hollowMesh = CSG.toMesh(hollowCSG, outerMesh.matrix);
    hollowMesh.castShadow = true;
    hollowMesh.receiveShadow = true;
    return hollowMesh;
  }
  private cutCylinderEnd45(
    sourceMesh: THREE.Mesh,
    angleDeg: number = 45,
    dir: 1 | -1 = 1,
    material?: THREE.Material
  ): THREE.Mesh {
    if (!sourceMesh.geometry) throw new Error("sourceMesh must have geometry.");
    sourceMesh.updateMatrixWorld(true);
    const geomWorld = sourceMesh.geometry.clone();
    geomWorld.applyMatrix4(sourceMesh.matrixWorld);

    geomWorld.computeBoundingBox();
    const bbox = geomWorld.boundingBox!;
    const yMin = bbox.min.y;
    const yMax = bbox.max.y;
    const centerX = 0.5 * (bbox.min.x + bbox.max.x);
    const centerZ = 0.5 * (bbox.min.z + bbox.max.z);
    let endY = dir === 1 ? yMax  : yMin;
    endY -= this.innerRadius 
    const centerPoint = new THREE.Vector3(centerX, endY, centerZ); // 目标端面中心（世界坐标）
    console.log(centerPoint)
    const sizeX = bbox.max.x - bbox.min.x;
    const sizeZ = bbox.max.z - bbox.min.z;
    const radiusApprox = Math.max(sizeX, sizeZ) / 2;
    const boxWidth = Math.max( radiusApprox * 8, 1.0 );    // 横向覆盖
    const boxHeight = Math.max( radiusApprox * 8, 1.0 );   // 另一个横向覆盖
    const boxDepth = Math.max( (yMax - yMin) * 6, 1.0 );  // 足够深以确保切除

    const cutterGeo = new THREE.BoxGeometry(boxWidth, boxDepth, boxHeight);

    const cutter = new THREE.Mesh(cutterGeo);
    cutter.geometry.computeBoundingBox();

    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    const rotAngle = dir === 1 ? -angleRad : angleRad; // 如果切上端，向 -X 旋转以让刀面斜向外（经验方向）
    const q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotAngle);
    cutter.quaternion.copy(q);

    const localFaceNormal = new THREE.Vector3(0, 1, 0);
    const worldFaceNormal = localFaceNormal.clone().applyQuaternion(cutter.quaternion).normalize();
    const halfDepth = boxDepth / 2;
    // console.log('halfDepth==>',halfDepth)
    const cutterCenter = centerPoint.clone().sub(worldFaceNormal.clone().multiplyScalar(halfDepth));
    cutter.position.copy(cutterCenter);

    const meshA = new THREE.Mesh(geomWorld, material ?? (Array.isArray(sourceMesh.material) ? sourceMesh.material[0] : sourceMesh.material));
    meshA.updateMatrixWorld(true);

    const cutterWorldGeo = cutter.geometry.clone();
    cutterWorldGeo.applyMatrix4(cutter.matrix); 
    const cutterMatrixWorld = new THREE.Matrix4();
    cutterMatrixWorld.compose(cutter.position, cutter.quaternion, new THREE.Vector3(1,1,1));
    cutterWorldGeo.applyMatrix4(cutterMatrixWorld);

    const meshCutter = new THREE.Mesh(cutterWorldGeo);
    meshCutter.updateMatrixWorld(true);

    const csgA = CSG.fromMesh(meshA);
    const csgC = CSG.fromMesh(meshCutter);
    const resultCSG = csgA.intersect(csgC);
    const resultMesh = CSG.toMesh(resultCSG, new THREE.Matrix4(), material ?? (Array.isArray(sourceMesh.material) ? sourceMesh.material[0] : sourceMesh.material));

    // 计算法线，清理矩阵（返回的 mesh 在世界坐标中，无需再应用 sourceMesh 的 transform）
    resultMesh.geometry.computeVertexNormals();
    resultMesh.geometry.computeBoundingBox();
    resultMesh.geometry.computeBoundingSphere();
    resultMesh.matrix.identity();
    resultMesh.matrixWorld.identity();
    resultMesh.position.set(0,0,0);
    resultMesh.rotation.set(0,0,0);
    resultMesh.scale.set(1,1,1);

    return resultMesh;
  }
  private buildMesh(){
    let material = new THREE.MeshStandardMaterial({
      color: 0x33aaff,
      metalness: 0.2,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const pipeA = this.createHollowCylinder();
    const pipeB = this.createHollowCylinder();
    // this.group.add(pipeA, pipeB);
    // 各切掉 45°
    const cutA = this.cutCylinderEnd45(pipeA);
    const cutB = this.cutCylinderEnd45(pipeB);

    cutA.rotation.set(Math.PI / 2,0,-Math.PI / 2)
    cutA.position.set(this.length / 2,0,0)

    cutB.rotation.set(Math.PI,Math.PI / 2,0)
    cutB.position.set(this.length - this.innerRadius,this.length / 2 - this.innerRadius,0)
    cutA.material = material;
    cutB.material = material;
    this.group.add(cutA,cutB);

    const axesHelper = new THREE.AxesHelper(0.3);
    axesHelper.raycast = function() {};
    this.group.add(axesHelper);
  }
  
  private initPortList() {
    let port1 = new Port(
      this,
      'main',
      'in',
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,-1,0)
    )
    port1.updateLocal = () =>{
      port1.localPos = new THREE.Vector3(0,0,0)
      port1.localDir = new THREE.Vector3(-1,0,0)
      // console.log(port1)
    }
    this.portList.push(port1)
    
  }
  public getObject3D() {
    return this.group;
  }
  public updateDiameter(innerR: number) {
    this.innerRadius = innerR;

    this.group.clear();
    this.buildMesh();
  }
  getPort(type:string){
    // console.log('getPort',type)
    return this.portList.filter((item:Port) => item.type.includes(type))
  }
}