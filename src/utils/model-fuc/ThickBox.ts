import * as THREE from 'three';

export interface ThickBoxOptions {
  width?: number;
  height?: number;
  depth?: number;
  thickness?: number;
  outerColor?: THREE.ColorRepresentation;
  innerColor?: THREE.ColorRepresentation;
  topColor?: THREE.ColorRepresentation;
  opacity?: number;
}

export class ThickBox extends THREE.Object3D {
  private outerMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]>;
  private innerMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  private outerMaterials: THREE.MeshStandardMaterial[];

  private _size: { width: number; height: number; depth: number };
  private _thickness: number;
  private _outerColor: THREE.ColorRepresentation;
  private _innerColor: THREE.ColorRepresentation;
  private _topColor: THREE.ColorRepresentation;
  private _opacity: number;

  private readonly TOP_MATERIAL_INDEX = 2; // +Y 面通常是第3个材质

  constructor(options: ThickBoxOptions = {}) {
    super();

    const {
      width = 1,
      height = 1,
      depth = 1,
      thickness = 0.05,
      outerColor = 0x156289,
      innerColor = 0xffcc00,
      topColor = 0xff0000,
      opacity = 0.5, // 半透明
    } = options;

    this._size = { width, height, depth };
    this._thickness = thickness;
    this._outerColor = outerColor;
    this._innerColor = innerColor;
    this._topColor = topColor;
    this._opacity = opacity;

    // 创建外层材质（含顶部）
    this.outerMaterials = this.createOuterMaterials();

    // 创建外层 mesh
    this.outerMesh = this.createOuterMesh();
    this.add(this.outerMesh);

    // 创建内层 mesh
    this.innerMesh = this.createInnerMesh();
    this.add(this.innerMesh);
  }

  /** 创建外层材质数组 */
  private createOuterMaterials(): THREE.MeshStandardMaterial[] {
    const materials: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < 6; i++) {
      const color = i === this.TOP_MATERIAL_INDEX ? this._topColor : this._outerColor;
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.5,
        transparent: true,
        opacity: this._opacity,
        side: THREE.FrontSide,
      });
      materials.push(mat);
    }
    return materials;
  }

  /** 创建外层盒子 */
  private createOuterMesh(): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]> {
    const { width, height, depth } = this._size;
    const geom = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geom, this.outerMaterials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /** 创建内层盒子 */
  private createInnerMesh(): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> {
    const { width, height, depth } = this._size;
    const t = this._thickness;

    const innerW = width - 2 * t;
    const innerH = height - 2 * t;
    const innerD = depth - 2 * t;

    if (innerW <= 0 || innerH <= 0 || innerD <= 0) {
      throw new Error('ThickBox: thickness too large, inner box would be inverted.');
    }

    const geom = new THREE.BoxGeometry(innerW, innerH, innerD);
    const mat = new THREE.MeshStandardMaterial({
      color: this._innerColor,
      metalness: 0,
      roughness: 0.7,
      side: THREE.BackSide,
      transparent: true,
      opacity: this._opacity,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }

  // ========= 公共方法 =========

  /** 设置顶部颜色 */
  public setTopColor(color: THREE.ColorRepresentation) {
    this._topColor = color;
    const topMat = this.outerMaterials[this.TOP_MATERIAL_INDEX];
    topMat.color.set(color);
  }

  /** 设置外层颜色 */
  public setOuterColor(color: THREE.ColorRepresentation) {
    this._outerColor = color;
    this.outerMaterials.forEach((mat, i) => {
      if (i !== this.TOP_MATERIAL_INDEX) mat.color.set(color);
    });
  }

  /** 设置内层颜色 */
  public setInnerColor(color: THREE.ColorRepresentation) {
    this._innerColor = color;
    this.innerMesh.material.color.set(color);
  }

  /** 设置厚度 */
  public setThickness(thickness: number) {
    if (thickness <= 0) return;
    this._thickness = thickness;

    this.remove(this.innerMesh);
    this.innerMesh.geometry.dispose();
    this.innerMesh.material.dispose();
    this.innerMesh = this.createInnerMesh();
    this.add(this.innerMesh);
  }

  /** 设置整体尺寸 */
  public setSize(width: number, height: number, depth: number) {
    this._size = { width, height, depth };
    this.remove(this.outerMesh);
    this.outerMesh.geometry.dispose();
    this.outerMesh = this.createOuterMesh();
    this.add(this.outerMesh);

    this.setThickness(this._thickness);
  }

  /** 设置透明度 */
  public setOpacity(opacity: number) {
    this._opacity = opacity;
    this.outerMaterials.forEach((m) => (m.opacity = opacity));
    this.innerMesh.material.opacity = opacity;
  }

  /** 销毁释放资源 */
  public dispose() {
    this.outerMesh.geometry.dispose();
    this.outerMaterials.forEach((mat) => mat.dispose());
    this.innerMesh.geometry.dispose();
    this.innerMesh.material.dispose();
  }
}