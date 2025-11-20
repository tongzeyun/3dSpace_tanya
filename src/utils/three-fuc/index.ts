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



/**
 * Description: 连接管函数
 * @param {THREE.Object3D} pipeA 管A的模型 (移动调整的模型)
 * @param {THREE.Object3D} pipeB 管B的模型 (固定不动的模型)
 * @param {THREE.Vector3} port.pos 管A的端口位置 (相对于A模型的局部位置)
 * @param {THREE.Vector3} port.dir 管A的端口法线方向 (相对于管道横截面的法线)
*/ 
export const connectPipes = (
  pipeA: THREE.Object3D,
  portA: { pos: THREE.Vector3; dir: THREE.Vector3 },
  pipeB: THREE.Object3D,
  portB: { pos: THREE.Vector3; dir: THREE.Vector3 }
) => {
  // 1. 获取 A 在世界坐标下的端口位置和方向
  const A_pos_world = pipeA.localToWorld(portA.pos.clone());
  const A_dir_world = pipeA.localToWorld(portA.pos.clone().add(portA.dir)).sub(A_pos_world).normalize();

  // 2. 获取 B 在世界坐标下的端口位置和方向
  const B_pos_world = pipeB.localToWorld(portB.pos.clone());
  const B_dir_world = pipeB.localToWorld(portB.pos.clone().add(portB.dir)).sub(B_pos_world).normalize();

  // 3. 需要让 A 的方向 对齐到 -B 的方向（因为管道是端对端）
  const targetDir = B_dir_world.clone().multiplyScalar(-1);

  // 旋转四元数
  const q = new THREE.Quaternion().setFromUnitVectors(A_dir_world, targetDir);

  // 应用旋转（旋转要绕 A 的端口点进行）
  pipeA.applyQuaternion(q);

  // 旋转后重新计算 A 的端口世界坐标
  const A_new_pos_world = pipeA.localToWorld(portA.pos.clone());

  // 4. 平移 A，使 A 的端口位置与 B 的端口位置重合
  const offset = B_pos_world.clone().sub(A_new_pos_world);
  pipeA.position.add(offset);
}