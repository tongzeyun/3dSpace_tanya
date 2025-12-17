import * as THREE from "three";

class MaterialCache {
  private cache = new Map<string, THREE.Material>();

  getMeshMaterial(colorArr?: number[]) {
    const colorKey = colorArr ? colorArr.join(",") : "default";
    if (this.cache.has(colorKey)) return this.cache.get(colorKey)!;

    const mat = new THREE.MeshStandardMaterial({
      color: colorArr ? new THREE.Color(colorArr[0], colorArr[1], colorArr[2]) : 0xcccccc,
    });

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