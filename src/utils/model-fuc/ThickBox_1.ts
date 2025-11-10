// TransparentBox.ts
import * as THREE from 'three';

export interface TransparentBoxOptions {
  width?: number;
  height?: number;
  depth?: number;
  thickness?: number; // 壁厚
  outerColor?: THREE.ColorRepresentation;
  innerColor?: THREE.ColorRepresentation;
  topColor?: THREE.ColorRepresentation;
  opacity?: number; // 整体透明度
}

export class TransparentBox_1 extends THREE.Group {
  private outerMesh: THREE.Mesh;
  private innerMesh: THREE.Mesh;
  private topMesh: THREE.Mesh;

  constructor(options: TransparentBoxOptions = {}) {
    super();

    const {
      width = 2,
      height = 2,
      depth = 2,
      thickness = 0.1,
      outerColor = '#00aaff',
      innerColor = '#0077aa',
      topColor = '#ff6600',
      opacity = 0.5,
    } = options;

    // === 外层长方体 ===
    const outerGeo = new THREE.BoxGeometry(width, height, depth);
    const outerMat = new THREE.MeshStandardMaterial({
      color: outerColor,
      transparent: true,
      opacity,
      side: THREE.BackSide, // 从内看外层
    });
    this.outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.add(this.outerMesh);

    // === 内层长方体（比外层小一点）===
    const innerGeo = new THREE.BoxGeometry(
      width - thickness * 2,
      height - thickness,
      depth - thickness * 2
    );
    const innerMat = new THREE.MeshStandardMaterial({
      color: innerColor,
      transparent: true,
      opacity,
      side: THREE.FrontSide,
    });
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerMesh.position.y = thickness / 2 + 0.001;
    this.add(this.innerMesh);

    // === 顶部单独的面 ===
    const topGeo = new THREE.BoxGeometry(width, thickness  , depth);
    const topMat = new THREE.MeshPhysicalMaterial({
      color: topColor,
      transparent: true,
      opacity,
      side: THREE.FrontSide,
      roughness: 0.2,
      metalness: 0.0,
      transmission: 0.0,
    });
    this.topMesh = new THREE.Mesh(topGeo,topMat);
    this.topMesh.position.y = height / 2; // 放到最上面
    this.add(this.topMesh);
  }
  getObject3d() {
    return this;
  }
  /** 修改顶部颜色 */
  setTopColor(color: THREE.ColorRepresentation) {
    (this.topMesh.material as THREE.MeshStandardMaterial).color.set(color);
  }

  /** 修改内外层透明度 */
  setOpacity(opacity: number) {
    (this.outerMesh.material as THREE.MeshStandardMaterial).opacity = opacity;
    (this.innerMesh.material as THREE.MeshStandardMaterial).opacity = opacity;
    (this.topMesh.material as THREE.MeshStandardMaterial).opacity = opacity;
  }

  /** 设置内外层颜色 */
  setColors(outer: THREE.ColorRepresentation, inner: THREE.ColorRepresentation) {
    (this.outerMesh.material as THREE.MeshStandardMaterial).color.set(outer);
    (this.innerMesh.material as THREE.MeshStandardMaterial).color.set(inner);
  }
  setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
  }
}