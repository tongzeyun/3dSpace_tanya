import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader , type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
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
// export const connectPipes = (
//   pipeA: THREE.Object3D,
//   portA: { pos: THREE.Vector3; dir: THREE.Vector3 },
//   pipeB: THREE.Object3D,
//   portB: { pos: THREE.Vector3; dir: THREE.Vector3 }
// ) => {
//   // console.log(pipeA,portA,pipeB,portB)
//   // 获取 A 在世界坐标下的端口位置和方向
//   const A_pos_world = pipeA.localToWorld(portA.pos.clone());
//   const A_dir_world = pipeA.localToWorld(portA.pos.clone().add(portA.dir)).sub(A_pos_world).normalize();
//   // console.log(A_pos_world.clone(),A_dir_world.clone())
//   // 获取 B 在世界坐标下的端口位置和方向
//   const B_pos_world = pipeB.localToWorld(portB.pos.clone());
//   const B_dir_world = pipeB.localToWorld(portB.pos.clone().add(portB.dir)).sub(B_pos_world).normalize();
//   // console.log(B_pos_world.clone(),B_dir_world.clone())
//   // A 的方向 对齐到 -B 的方向（因为管道是端对端）
//   const targetDir = B_dir_world.clone().multiplyScalar(-1);

//   // 旋转四元数
//   const q = new THREE.Quaternion().setFromUnitVectors(A_dir_world, targetDir);

//   // 应用旋转（旋转要绕 A 的端口点进行）
//   pipeA.applyQuaternion(q);

//   // 旋转后重新计算 A 的端口世界坐标
//   const A_new_pos_world = pipeA.localToWorld(portA.pos.clone());

//   // 平移 A，使 A 的端口位置与 B 的端口位置重合
//   const offset = B_pos_world.clone().sub(A_new_pos_world);
//   pipeA.position.add(offset);
// }

export const connectPipes = (
  pipeA: THREE.Object3D,
  portA: { pos: THREE.Vector3; dir: THREE.Vector3 },
  pipeB: THREE.Object3D,
  portB: { pos: THREE.Vector3; dir: THREE.Vector3 }
) => {
  // 使用复用临时对象减少分配
  const _mA = new THREE.Matrix4();
  const _mParentInv = new THREE.Matrix4();
  const _mNew = new THREE.Matrix4();
  const _t1 = new THREE.Vector3();
  const _t2 = new THREE.Vector3();
  const _qRot = new THREE.Quaternion();
  const _qParent = new THREE.Quaternion();
  const _scale = new THREE.Vector3();
  const _localMat = new THREE.Matrix4();

  // 确保 matrixWorld 是最新的
  pipeA.updateMatrixWorld(true);
  pipeB.updateMatrixWorld(true);

  // 世界空间端口位置
  const A_pos_world = pipeA.localToWorld(portA.pos.clone());
  const A_dir_world = pipeA.localToWorld(portA.pos.clone().add(portA.dir)).sub(A_pos_world).normalize();
  const B_pos_world = pipeB.localToWorld(portB.pos.clone());
  const B_dir_world = pipeB.localToWorld(portB.pos.clone().add(portB.dir)).sub(B_pos_world).normalize();

  // 目标方向（A 对齐到 -B）
  const targetDir = B_dir_world.clone().multiplyScalar(-1);

  // 计算在世界空间的旋转四元数（将 A_dir_world 旋转到 targetDir）
  _qRot.setFromUnitVectors(A_dir_world, targetDir);

  // 获取 pipeA 的世界矩阵
  _mA.copy(pipeA.matrixWorld);

  // 构造绕端口点在世界空间的旋转矩阵： M' = T(p) * R * T(-p) * M_A
  const T_neg = new THREE.Matrix4().makeTranslation(-A_pos_world.x, -A_pos_world.y, -A_pos_world.z);
  const T_pos = new THREE.Matrix4().makeTranslation(A_pos_world.x, A_pos_world.y, A_pos_world.z);
  const R = new THREE.Matrix4().makeRotationFromQuaternion(_qRot);

  _mNew.multiplyMatrices(T_pos, R).multiply(T_neg).multiply(_mA);

  // 旋转后计算 A 端口的新世界位置
  const A_new_pos_world = _t1.set(0,0,0);
  A_new_pos_world.applyMatrix4(_mNew).applyMatrix4(new THREE.Matrix4().makeTranslation(0,0,0)); // 保证类型

  // 平移以使端口与 B 对齐：在世界空间上对整个 pipeA 的新矩阵做平移
  const offset = new THREE.Vector3().subVectors(B_pos_world, A_new_pos_world);
  const T_offset = new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z);
  _mNew.premultiply(T_offset); // 将平移加到结果上

  // 将 world 矩阵转换为 pipeA 的本地矩阵（相对于 parent）
  if (pipeA.parent) {
    pipeA.parent.updateMatrixWorld(true);
    _mParentInv.copy(pipeA.parent.matrixWorld).invert();
    _localMat.multiplyMatrices(_mParentInv, _mNew);
  } else {
    _localMat.copy(_mNew);
  }

  // 分解并直接设置 pipeA 的局部变换（避免 applyQuaternion/position.add 的多步骤）
  _localMat.decompose(pipeA.position, pipeA.quaternion, _scale);
  pipeA.scale.copy(_scale);

  // 标记矩阵已更新
  pipeA.updateMatrix();
  pipeA.updateMatrixWorld(true);
}