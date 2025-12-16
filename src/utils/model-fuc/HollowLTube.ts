import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { Port } from "./Port";
import { Flange } from "./Flange";

export interface HollowLTubeOptions{
  length: number;
  diameter: number;
  thickness: number;
}

export class HollowLTube {
  public group: THREE.Group;
  public params: HollowLTubeOptions;
  public portList: Port[] = []
  public flanges: {flange:Flange,offset?:number[]}[] = [];
  private material: THREE.MeshStandardMaterial;
  public activeFlange: {flange:Flange,offset?:number[]} | null = null;
  public id:string = String(Math.random()).slice(4)
  public type = 'LTube'

  constructor(options: Partial<HollowLTubeOptions>){
    const defaults : HollowLTubeOptions = {
      length: 0.4,
      diameter: 0.05,
      thickness: 0.005,
    }
    this.params = {...defaults, ...options};
    this.group = new THREE.Group()
    this.group.name = 'HollowLTube';
    this.group.userData = {...this.params}
    this.material = new THREE.MeshStandardMaterial({
      color: 0xd6d5e3,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.buildMesh()
    this.initPortList()
  }

  private createHollowCylinder() {
    let innerR = this.params.diameter / 2;
    let outerR = innerR + this.params.thickness;
    
    let length = this.params.length
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
    endY -= (this.params.diameter / 2 + this.params.thickness); 
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
    
    let length = this.params.length
    let innerRadius = this.params.diameter / 2;
    let thickness = this.params.thickness;
    const pipeA = this.createHollowCylinder();
    const pipeB = this.createHollowCylinder();
    // this.group.add(pipeA, pipeB);
    // 各切掉 45°
    const cutA = this.cutCylinderEnd45(pipeA);
    const cutB = this.cutCylinderEnd45(pipeB);

    cutA.rotation.set(Math.PI / 2,0,-Math.PI / 2)
    cutA.position.set(length / 2,0,0)

    cutB.rotation.set(Math.PI,Math.PI / 2,0)
    cutB.position.set(length-innerRadius-thickness,length/2-innerRadius-thickness,0)
    cutA.material = this.material;
    cutB.material = this.material;
    this.group.add(cutA,cutB);

    const axesHelper = new THREE.AxesHelper(0.3);
    axesHelper.raycast = function() {};
    this.group.add(axesHelper);
  }
  createFlange(){
    let obj = {
      diameter: this.params.diameter + this.params.thickness *2,
      length: 0.05,
    }
    return new Flange(obj)
  }
  private initPortList() {
    let port1 = new Port(
      this,
      'main',
      'in',
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(-1,0,0)
    )
    this.portList.push(port1)
    let flange1 = this.createFlange()
    let flangeMesh1 = flange1.getObject3D()
    this.group.add(flangeMesh1)
    flangeMesh1.position.set(flange1.params.length/2,0,0)
    flangeMesh1.rotation.set(0,0,Math.PI/2)
    flange1.setPort(port1)
    this.flanges.push({flange:flange1})

    let offsetX = this.params.length-this.params.diameter/2-this.params.thickness
    let offsetY = this.params.length-this.params.diameter/2-this.params.thickness
    let port2 = new Port(
      this,
      'main',
      'out',
      new THREE.Vector3(offsetX,offsetY,0),
      new THREE.Vector3(0,1,0)
    )
    this.portList.push(port2)
    let flange2 = this.createFlange()
    let flangeMesh2 = flange2.getObject3D()
    this.group.add(flangeMesh2)
    
    flangeMesh2.position.set(offsetX,offsetY-flange2.params.length/2,0)
    // flangeMesh2.rotation.set(0,0,Math.PI/2)
    flange2.setPort(port2)
    this.flanges.push({flange:flange2})

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
  setSeleteState(){
    this.setColor(0x005bac)
  }
  setUnseleteState(){
    this.setColor(0xd6d5e3)
  }
  setColor(color: string | number | THREE.Color){
    this.material.color.set(color)
    this.material.needsUpdate = true
  }
  public getObject3D() {
    return this.group;
  }
  public updateDiameter(diameter: number) {
    this.params.diameter = diameter;

    this.group.clear();
    this.buildMesh();
  }
  getPort(type:string){
    // console.log('getPort',type)
    return this.portList.filter((item:Port) => item.type.includes(type))
  }
  notifyPortsUpdated() {
    for (const port of this.portList) {
      // port.updateLocal()
      if(port.connected && port.isConnected){
        // console.log('port notifyPortsUpdated===>', port);
        // this.updatePortList()
        port.onParentTransformChanged();
      }
    }
  }
}