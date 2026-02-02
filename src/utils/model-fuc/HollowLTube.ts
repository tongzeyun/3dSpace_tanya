import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { Port } from "./Port";
import { Flange } from "./Flange";
import { flangeBaseOptions, LTubeBaseOptions } from "@/assets/js/modelBaseInfo";
import { materialCache } from "../three-fuc/MaterialCache";
import { BaseModel } from "./BaseModel";

export interface HollowLTubeOptions{
  length: number;
  diameter: number;
  thickness: number;
}

const modelSize = [
  {length: 0.04, diameter:0.016},
  {length: 0.05, diameter:0.025},
  {length: 0.065, diameter:0.040},
  {length: 0.088,diameter:0.063},
  {length: 0.108,diameter:0.100},
  {length: 0.138,diameter:0.160},
  {length: 0.208,diameter:0.250},
] as {length:number,diameter:number}[]

export class HollowLTube extends BaseModel {
  public params!: HollowLTubeOptions;
  private cutA !: THREE.Mesh;
  private cutB !: THREE.Mesh;

  constructor(options: any) {
    super();
    this.type = 'LTube';
    this.rotateAxis = 'X';
    const defaults = Object.assign({}, LTubeBaseOptions, options)
    let obj = {} as {length:number,diameter:number}
    modelSize.forEach((item) => {
      if(options.diameter === item.diameter){
        obj = Object.assign(obj,item)
      }
    })
    if(!obj.length){
      console.error('HollowLTube 尺寸参数错误')
      return
    }
    this.params = Object.assign({}, defaults, obj);
    this.initBaseModel('HollowLTube', {...this.params}, options?.id || '');
    this.material = materialCache.getMeshMaterial(0xd6d5e3);
    this.buildMesh();
    this.initPortList();
    if(options.flangeList){
      options.flangeList.forEach((flangeOptions: any,index: number) => {
        this.flanges[index].flange.id = flangeOptions.flange.id
      })
    }
    if(options.portList){
      options.portList.forEach((portOptions: any,index: number) => {
        this.portList[index].id = portOptions.id
      })  
    }
    if(options.rotate){
      const [x, y, z, order] = options.rotate;
      // 使用欧拉角设置旋转
      this.group.rotation.set(x, y, z);
      // 设置旋转顺序（如果提供了）
      if(order && typeof order === 'string'){
        const validOrders: THREE.EulerOrder[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
        if(validOrders.includes(order as THREE.EulerOrder)){
          this.group.rotation.order = order as THREE.EulerOrder;
        }
      }
    }
  }

  private createHollowCylinder() {
    let innerR = this.params.diameter / 2;
    let outerR = innerR + this.params.thickness;
    
    let length = this.params.length + innerR
    let radialSegs = 64
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
    const rotAngle = dir === 1 ? -angleRad : angleRad; // 如果切上端，向 -X 旋转以让刀面斜向外
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
    this.group.clear();
    this.clearMeshList(); // 重建时清空 meshList
    
    let innerRadius = this.params.diameter / 2;
    let length = this.params.length + innerRadius
    let thickness = this.params.thickness;
    const pipeA = this.createHollowCylinder();
    const pipeB = this.createHollowCylinder();
    // this.group.add(pipeA, pipeB);
    // 各切掉 45°
    this.cutA = this.cutCylinderEnd45(pipeA);
    this.cutB = this.cutCylinderEnd45(pipeB);

    this.cutA.rotation.set(-Math.PI / 2,0,-Math.PI / 2)
    this.cutA.position.set(length / 2,0,0)

    this.cutB.rotation.set(0,Math.PI / 2,0)
    this.cutB.position.set(length-innerRadius-thickness,-length/2+innerRadius+thickness,0)
    
    // 确保 material 已初始化
    if (!this.material) {
      this.material = materialCache.getMeshMaterial(0xd6d5e3);
    }
    this.cutA.material = this.material;
    this.cutB.material = this.material;
    this.group.add(this.cutA, this.cutB);
    
    // 添加到 meshList
    this.addMesh([this.cutA, this.cutB]);

    // const axesHelper = new THREE.AxesHelper(0.3);
    // axesHelper.raycast = function() {};
    // this.group.add(axesHelper);
  }
  protected createFlange(): Flange {
    let obj = {
      ...flangeBaseOptions,
      drawDiameter: this.params.diameter,
      actualDiameter: this.params.diameter,
    }
    return new Flange(obj)
  }
  protected initPortList() {
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

    let offsetX = this.params.length-this.params.thickness
    let offsetY = this.params.length-this.params.thickness
    let port2 = new Port(
      this,
      'main',
      'out',
      new THREE.Vector3(offsetX,-offsetY,0),
      new THREE.Vector3(0,-1,0)
    )
    this.portList.push(port2)
    let flange2 = this.createFlange()
    let flangeMesh2 = flange2.getObject3D()
    this.group.add(flangeMesh2)
    
    flangeMesh2.position.set(offsetX,-offsetY+flange2.params.length/2,0)
    // flangeMesh2.rotation.set(0,0,Math.PI/2)
    flange2.setPort(port2)
    this.flanges.push({flange:flange2})
  }
  public setColor(color: number | string = 0x005bac): void {
    // 使用基类的 setColor，它会自动使用 meshList
    super.setColor(color);
    // 更新材质引用
    this.material = materialCache.getMeshMaterial(color);
  }
  public updateDiameter(diameter: number) {
    this.params.diameter = diameter;
    this.buildMesh();
    // 重新初始化端口列表
    this.portList = [];
    this.flanges = [];
    this.initPortList();
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 调用基类的 dispose 方法进行清理
    super.dispose();
  }
}