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

// 将3D场景中的坐标转换成屏幕坐标
export const worldToScreen = (point: THREE.Vector3,camera: THREE.Camera, renderer: THREE.WebGLRenderer) => { 
  // console.log("point===>", point);
  const vector = point.clone();
  vector.project(camera);
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;
  return {
    x: (vector.x + 1) / 2 * width,
    y: (-vector.y + 1) / 2 * height
  };
}