import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader , type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { materialCache } from "./MaterialCache";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// import occt from "occt-import-js";

export const disposeObject = (obj: THREE.Object3D) => {
  obj.traverse((child: any) => {
    // 释放几何体
    if (child.geometry) {
      child.geometry.dispose();
    }

    // 释放材质（可能是数组）
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m: THREE.Material) => disposeMaterial(m));
      } else {
        disposeMaterial(child.material);
      }
    }
  });
}
const disposeMaterial = (material: THREE.Material) => {
  // 释放材质中的贴图纹理
  for (const key in material) {
    const value = material[key as keyof THREE.Material];
    if (value instanceof THREE.Texture) {
      value.dispose(); // Texture dispose
    }
  }
  material.dispose(); // Material dispose
}

export interface LoadModelOptions {
  dracoDecoderPath?: string; // 如果 GLB/GLTF 使用 Draco 压缩，需提供解码器路径（例如 '/draco/'）
  onProgress?: (event: ProgressEvent<EventTarget>) => void;
  // crossOrigin 和其他选项可按需扩展
}

export async function loadModel(url: string, options?: LoadModelOptions): Promise<THREE.Object3D> {
  const opt = options || {};
  const cleaned = url.split('?')[0].split('#')[0].trim();
  const ext = (cleaned.match(/\.[^.]+$/)?.[0] || '').toLowerCase();

  return new Promise<THREE.Object3D>((resolve, reject) => {
    const onProgress = opt.onProgress ?? (() => {});
    if (ext === '.gltf' || ext === '.glb') {
      const loader = new GLTFLoader();
      if (opt.dracoDecoderPath) {
        const draco = new DRACOLoader();
        draco.setDecoderPath(opt.dracoDecoderPath);
        loader.setDRACOLoader(draco);
      }
      loader.load(
        url,
        (gltf:GLTF) => {
          resolve(gltf.scene || new THREE.Group());
        },
        (xhr:any) => onProgress(xhr as ProgressEvent<EventTarget>),
        (err:any) => reject(err)
      );
      return;
    }

    if (ext === '.fbx') {
      const loader = new FBXLoader();
      loader.load(
        url,
        (obj:THREE.Object3D) => {
          resolve(obj);
        },
        (xhr:any) => onProgress(xhr as ProgressEvent<EventTarget>),
        (err:any) => reject(err)
      );
      return;
    }

    reject(new Error('Unsupported file extension: ' + ext + '. Supported: .gltf .glb .fbx'));
  });
}

export const findRootGroup = (obj: any) : THREE.Group | null => {
  while (obj) {
    if (obj.userData.isRoot) return obj;
    obj = obj.parent!;
  }
  return null;
}


/**
 * Description: 连接管函数
 * @param {THREE.Object3D} pipeA 管A的模型 (移动调整的模型)
 * @param {THREE.Object3D} pipeB 管B的模型 (固定不动的模型)
 * @param {THREE.Vector3} port.pos 管A的端口位置 (相对于A模型的局部位置)
 * @param {THREE.Vector3} port.dir 管A的端口法线方向 (相对于管道横截面的法线)
*/ 
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vTmp = new THREE.Vector3();
const _aPosWorld = new THREE.Vector3();
const _bPosWorld = new THREE.Vector3();
const _aDirWorld = new THREE.Vector3();
const _bDirWorld = new THREE.Vector3();

const _matA = new THREE.Matrix4();
// const _matB = new THREE.Matrix4();
const _matR = new THREE.Matrix4();
const _matT = new THREE.Matrix4();

const _qAlign = new THREE.Quaternion();

export function connectPipes(
  pipeA: THREE.Object3D,
  portA: { pos: THREE.Vector3; dir: THREE.Vector3 },
  pipeB: THREE.Object3D,
  portB: { pos: THREE.Vector3; dir: THREE.Vector3 }
) {

  // --- 1. 取得世界矩阵 ---
  pipeA.updateMatrixWorld(true);
  pipeB.updateMatrixWorld(true);

  // --- 2. 计算 A、B 端口的世界位置 ---
  _aPosWorld.copy(portA.pos).applyMatrix4(pipeA.matrixWorld);
  _bPosWorld.copy(portB.pos).applyMatrix4(pipeB.matrixWorld);

  // --- 3. 计算 A、B 世界方向 ---
  _vA.copy(portA.pos).add(portA.dir).applyMatrix4(pipeA.matrixWorld);
  _aDirWorld.copy(_vA.sub(_aPosWorld)).normalize();

  _vB.copy(portB.pos).add(portB.dir).applyMatrix4(pipeB.matrixWorld);
  _bDirWorld.copy(_vB.sub(_bPosWorld)).normalize();

  // 目标方向为 -B_dir
  _bDirWorld.multiplyScalar(-1);

  // --- 4. 计算从 A_dir -> targetDir 的旋转 ---
  _qAlign.setFromUnitVectors(_aDirWorld, _bDirWorld);

  // --- 5. 构建绕 A_posWorld 的旋转矩阵：T(a) * R * T(-a) ---
  _matT.makeTranslation(-_aPosWorld.x, -_aPosWorld.y, -_aPosWorld.z);
  _matR.makeRotationFromQuaternion(_qAlign);
  _matA.multiplyMatrices(_matR, _matT);
  _matT.makeTranslation(_aPosWorld.x, _aPosWorld.y, _aPosWorld.z);
  _matA.multiplyMatrices(_matT, _matA);

  // --- 6. 应用旋转到 pipeA ---
  pipeA.applyMatrix4(_matA);

  // --- 7. 旋转后重新计算 A_posWorld ---
  pipeA.updateMatrixWorld(true);
  _aPosWorld.copy(portA.pos).applyMatrix4(pipeA.matrixWorld);

  // --- 8. 平移矩阵：使 A 与 B 对齐 ---
  _vTmp.subVectors(_bPosWorld, _aPosWorld); // offset = B - A

  _matT.makeTranslation(_vTmp.x, _vTmp.y, _vTmp.z);
  pipeA.applyMatrix4(_matT);

  pipeA.updateMatrixWorld(true);
}

function loadStepInWorker(url: string) {
  return new Promise(async (resolve, reject) => {
    const worker = new Worker(new URL('../tool/OcctStpWorker.js', import.meta.url), {
      type: 'module'
    });

    // 拉文件
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();

    // 启动 worker 解析
    worker.postMessage({ type: 'load', buffer }, [buffer]); // Transferable，避免复制内存

    worker.onmessage = (event) => {
      if (event.data.type === 'parsed') {
        resolve(event.data.result);
        worker.terminate();
      }
    };

    worker.onerror = reject;
  });
}

export async function loadStep(url:string) {
  const result:any = await loadStepInWorker(url);
  const group = new THREE.Group();
  const geometrys:any[] = []
  result.meshes.forEach((mesh:any) => {
    let m = buildMesh(mesh)
    // group.add(m);
    geometrys.push(m)
  });
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometrys, false);
  const defaultMaterial: THREE.Material = materialCache.getMeshMaterial([0xcccccc]);
  let m = new THREE.Mesh(mergedGeometry, defaultMaterial);
  group.add(m);
  group.scale.set(0.01, 0.01, 0.01)
  return group;
}

const buildMesh = (geometryMesh: any) => {
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3));
  if (geometryMesh.attributes.normal) {
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3));
  }
  geometry.name = geometryMesh.name;
  const index = Uint32Array.from(geometryMesh.index.array);
  geometry.setIndex(new THREE.BufferAttribute(index, 1));

  if (geometryMesh.brep_faces && geometryMesh.brep_faces.length > 0) {
    const triangleCount = geometryMesh.index.array.length / 3;
    let triangleIndex = 0;
    let faceColorGroupIndex = 0;
    while (triangleIndex < triangleCount) {
      const firstIndex = triangleIndex;
      let lastIndex = null;
      let materialIndex = null;
      if (faceColorGroupIndex >= geometryMesh.brep_faces.length) {
        lastIndex = triangleCount;
        materialIndex = 0;
      } else if (triangleIndex < geometryMesh.brep_faces[faceColorGroupIndex].first) {
        lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].first;
        materialIndex = 0;
      } else {
        lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].last + 1;
        materialIndex = faceColorGroupIndex + 1;
        faceColorGroupIndex++;
      }
      geometry.addGroup(firstIndex * 3, (lastIndex - firstIndex) * 3, materialIndex);
      triangleIndex = lastIndex;
    }
  }
  return geometry;
}
