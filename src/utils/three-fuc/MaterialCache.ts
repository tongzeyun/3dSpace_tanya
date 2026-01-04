import * as THREE from "three";

class MaterialCache {
  private cache = new Map<string, THREE.Material>();

  getMeshMaterial(color?: number | string | number[]) {
    const colorKey = Array.isArray(color) ? color.join(",") : (color !== undefined ? String(color) : "default");
    if (this.cache.has(colorKey)) return this.cache.get(colorKey)!;

    let mat: THREE.Material;
    if (Array.isArray(color)) {
      mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color[0], color[1], color[2]),
        metalness: 0.3,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: color !== undefined ? new THREE.Color(color as any) : 0xcccccc,
        metalness: 0.3,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
    }

    this.cache.set(colorKey, mat);
    return mat;
  }

  // 用于 debug 或释放全部材质
  disposeAll() {
    this.cache.forEach(m => m.dispose());
    this.cache.clear();
  }
}

export const materialCache = new MaterialCache();