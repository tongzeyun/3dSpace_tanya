// 主箱体类
import * as THREE from 'three'
type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
export interface FaceConfig {
  color?: number | string
  opacity?: number
}
interface TransparentBoxOptions {
  width?: number
  height?: number
  depth?: number
  thickness?: number
  faceConfigs?: Partial<Record<FaceName, FaceConfig>>
}
export class TransparentBox {
  public width: number
  public height: number
  public depth: number
  public thickness: number
  public group: THREE.Group
  public faces: Record<FaceName, THREE.Mesh>
  constructor(options: TransparentBoxOptions = {}) {
    const {
      width = 2,
      height = 1,
      depth = 1,
      thickness = 0.05,
      faceConfigs = {},
    } = options

    this.width = width
    this.height = height
    this.depth = depth
    this.thickness = thickness

    this.group = new THREE.Group()
    this.faces = {} as Record<FaceName, THREE.Mesh>

    const defaultConfig: FaceConfig = { color: 0xd6d5e3, opacity: 0.4 }

    this.faces.front = this._createFace(
      this.width - this.thickness,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.front }
    )
    this.faces.front.position.z = this.depth / 2 - this.thickness / 2

    this.faces.back = this._createFace(
      this.width - this.thickness,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.back }
    )
    this.faces.back.position.z = -this.depth / 2 + this.thickness / 2

    this.faces.top = this._createFace(
      this.width + this.thickness,
      this.depth,
      { ...defaultConfig, ...faceConfigs.top }
    )
    this.faces.top.rotation.x = Math.PI / 2
    this.faces.top.position.y = this.height / 2

    this.faces.bottom = this._createFace(
      this.width + this.thickness,
      this.depth,
      { ...defaultConfig, ...faceConfigs.bottom }
    )
    this.faces.bottom.rotation.x = Math.PI / 2
    this.faces.bottom.position.y = -this.height / 2

    this.faces.left = this._createFace(
      this.depth,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.left }
    )
    this.faces.left.rotation.y = Math.PI / 2
    this.faces.left.position.x = -this.width / 2

    this.faces.right = this._createFace(
      this.depth ,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.right }
    )
    this.faces.right.rotation.y = Math.PI / 2
    this.faces.right.position.x = this.width / 2 ;

    // 添加到组
    (Object.keys(this.faces) as FaceName[]).forEach((k) => {
      this.group.add(this.faces[k] as any)
    })
    this.group.userData.type = 'chamber'
  }

  private _createFace(w: number, h: number, cfg: FaceConfig): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(w, h, this.thickness)
    const material = new THREE.MeshPhysicalMaterial({
      color: cfg.color ?? 0xffffff,
      transparent: true,
      opacity: cfg.opacity ?? 0.5,
      roughness: 0.2,
      metalness: 0.0,
      transmission: 0.0,
      thickness: this.thickness,
      side: THREE.FrontSide,
    })
    // const material = new THREE.ShaderMaterial({
    //   uniforms: {
    //     uColor: { value: new THREE.Color(cfg.color ?? 0xffffff) },
    //     uOpacityFront: { value: (cfg.opacity ?? 0.5) * 0.6 }, // 前面更透明
    //     uOpacityBack: { value: (cfg.opacity ?? 0.5) * 1.2 },  // 后面更不透明
    //   },
    //   vertexShader: `
    //     varying vec3 vNormal;
    //     varying vec3 vPosition;
    //     void main() {
    //       vNormal = normalize(normalMatrix * normal);
    //       vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //     }
    //   `,
    //   fragmentShader: `
    //     uniform vec3 uColor;
    //     uniform float uOpacityFront;
    //     uniform float uOpacityBack;
    //     varying vec3 vNormal;
    //     varying vec3 vPosition;

    //     void main() {
    //       vec3 viewDir = normalize(-vPosition);
    //       float facing = dot(vNormal, viewDir);
    //       float alpha = facing > 0.0 ? uOpacityFront : uOpacityBack;

    //       gl_FragColor = vec4(uColor, alpha);
    //     }
    //   `,
    //   transparent: true,
    //   side: THREE.DoubleSide,
    // })
    return new THREE.Mesh(geometry, material)
  }

  public getObject3D(): THREE.Group {
    return this.group
  }

  public setFaceProperty(faceName: FaceName, cfg: FaceConfig) {
    const face :any= this.faces[faceName]
    if (!face) return
    if (cfg.color !== undefined) face.material.color.set(cfg.color as any)
    if (cfg.opacity !== undefined) face.material.opacity = cfg.opacity
    // 如果需要你可以强制更新材质：
    face.material.needsUpdate = true
  }

  public setSeleteState(color:number){
    const face :any= this.faces['top']
    face.material.color.set(color)
  }

  public setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z)
  }

  public setRotation(x: number, y: number, z: number) {
    this.group.rotation.set(x, y, z)
  }

  public setScale(x: number, y: number, z: number) {
    this.group.scale.set(x, y, z)
  }
}

interface CylinderOptions {
  radius: number
  height: number
  thickness: number            // 圆柱体壁厚
  color?: THREE.ColorRepresentation
  opacity?: number
  // baseColor?: THREE.ColorRepresentation
}

// 圆柱体
export class CylinderWithBase {
  group: THREE.Group
  private outerCylinder: THREE.Mesh
  private innerCylinder: THREE.Mesh
  private topBase: THREE.Mesh
  private bottomBase: THREE.Mesh

  constructor(options: CylinderOptions) {
    const { 
      radius, 
      height, 
      thickness, 
      color = 0xd6d5e3, 
      opacity = 0.4, 
      // baseColor = '#0077cc' 
    } = options

    this.group = new THREE.Group()

    const cylinderMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })

    const innerMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide, // 反转法线用于内壁
    })

    const baseMat = new THREE.MeshStandardMaterial({
      color: color,
      opacity,
      transparent: true,
      depthWrite: true,
      side: THREE.BackSide,
    })

    /** 外圆柱 */
    this.outerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 64),
      cylinderMat
    )

    /** 内圆柱 */
    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - thickness, radius - thickness, height, 64),
      innerMat
    )

    /** 顶部底座 */
    this.topBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius , radius, thickness, 64),
      baseMat.clone()
    )
    this.topBase.position.y = height / 2 + thickness / 2

    /** 底部底座 */
    this.bottomBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius , thickness, 64),
      baseMat.clone()
    )
    this.bottomBase.position.y = -height / 2 - thickness / 2

    this.group.add(this.outerCylinder, this.innerCylinder, this.topBase, this.bottomBase)
    this.group.userData.type = 'chamber'
  }

  /** 修改圆柱体半径 */
  setRadius(radius: number) {
    this.outerCylinder.geometry.dispose()
    this.innerCylinder.geometry.dispose()

    this.outerCylinder.geometry = new THREE.CylinderGeometry(radius, radius, this.getHeight(), 64)
    this.innerCylinder.geometry = new THREE.CylinderGeometry(radius - this.getThickness(), radius - this.getThickness(), this.getHeight(), 64)
  }

  /** 修改圆柱体高度 */
  setHeight(height: number) {
    this.outerCylinder.geometry.dispose()
    this.innerCylinder.geometry.dispose()

    this.outerCylinder.geometry = new THREE.CylinderGeometry(this.getRadius(), this.getRadius(), height, 64)
    this.innerCylinder.geometry = new THREE.CylinderGeometry(this.getRadius() - this.getThickness(), this.getRadius() - this.getThickness(), height, 64)

    // 更新底座位置
    this.topBase.position.y = height / 2 + this.getThickness() / 2
    this.bottomBase.position.y = -height / 2 - this.getThickness() / 2
  }

  /** 修改透明度 / 颜色 */
  setColor(color: THREE.ColorRepresentation, opacity?: number) {
    const mats = [this.outerCylinder.material, this.innerCylinder.material] as THREE.Material[]
    mats.forEach(mat => {
      (mat as THREE.MeshPhysicalMaterial).color.set(color)
      if (opacity !== undefined) (mat as THREE.MeshPhysicalMaterial).opacity = opacity
    })
  }

  // 修改选中时面颜色
  public setSeleteState(color:number){
    // const face :any = this.faces['top']
    // face.material.color.set(color)
    (this.topBase.material as any).color.set(color)
  }

  /** 单独修改底座颜色 */
  setBottomBaseColor(color: THREE.ColorRepresentation) {
    // (this.topBase.material as THREE.MeshStandardMaterial).color.set(color);
    (this.bottomBase.material as THREE.MeshStandardMaterial).color.set(color)
  }

  /** 设置位置 */
  setPosition(x: number, y: number, z: number){
    this.group.position.set(x, y, z)
  }
  /** 获取参数 */
  private getRadius() { return (this.outerCylinder.geometry as THREE.CylinderGeometry).parameters.radiusTop }
  private getHeight() { return (this.outerCylinder.geometry as THREE.CylinderGeometry).parameters.height }
  private getThickness() {
    return this.getRadius() -
      (this.innerCylinder.geometry as THREE.CylinderGeometry).parameters.radiusTop
  }
  getObject3D() {
    return this.group
  }
}

interface CapsuleOptions {
  radius: number        // 胶囊的球体半径
  height: number        // 中间圆柱部分的高度（不含半球）
  thickness: number     // 壁厚
  color?: THREE.ColorRepresentation
  opacity?: number
  outflatten ?:number
  inflatten ?:number
}

// 带壁厚的胶囊体
export class CapsuleWithThickness {
  group: THREE.Group

  private outerCylinder: THREE.Mesh
  private innerCylinder: THREE.Mesh

  private outerTopSphere: THREE.Mesh
  private outerBottomSphere: THREE.Mesh

  private innerTopSphere: THREE.Mesh
  private innerBottomSphere: THREE.Mesh

  constructor(options: CapsuleOptions) {
    const {
      radius,
      height,
      thickness,
      color = 0xd6d5e3,
      opacity = 0.4,
      // topBottomScale = 0.4, 
      outflatten = 0.4,
      inflatten = 0.385,
    } = options

    this.group = new THREE.Group()
    this.group.userData.type = 'chamber'
    /** 外壳材质 **/
    const outerMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })

    /** 内壳材质 **/
    const innerMat = new THREE.MeshPhysicalMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,   //  反向法线使内层可见
    })

    /** 中间圆柱部分 */
    this.outerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 64),
      outerMat.clone(),
    )

    this.innerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - thickness, radius - thickness, height, 64),
      innerMat.clone(),
    )

    /** 上半球 */
    this.outerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      outerMat.clone()
    )
    this.outerTopSphere.position.y = height / 2
    // this.outerTopSphere.scale.y = topBottomScale
    const outerTopPos = this.outerTopSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < outerTopPos.count; i++) {
      outerTopPos.setY(i, outerTopPos.getY(i) * outflatten)
    }
    outerTopPos.needsUpdate = true
    this.outerTopSphere.geometry.computeVertexNormals()

    /** 下半球 */
    this.outerBottomSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      outerMat.clone()
    )
    this.outerBottomSphere.position.y = -height / 2
    // this.outerBottomSphere.scale.y = topBottomScale
    const outerBottomPos = this.outerBottomSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < outerBottomPos.count; i++) {
      outerBottomPos.setY(i, outerBottomPos.getY(i) * outflatten)
    }
    outerBottomPos.needsUpdate = true
    this.outerBottomSphere.geometry.computeVertexNormals()

    /** 上半球 Inner*/
    this.innerTopSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius - thickness, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      innerMat.clone()
    )
    this.innerTopSphere.position.y = height / 2
    // this.innerTopSphere.scale.y = topBottomScale 
    const innerTopPos = this.innerTopSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < innerTopPos.count; i++) {
      innerTopPos.setY(i, innerTopPos.getY(i) * inflatten)
    }
    innerTopPos.needsUpdate = true
    this.innerTopSphere.geometry.computeVertexNormals()

    /** 下半球 */
    this.innerBottomSphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius - thickness, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      innerMat.clone()
    )
    this.innerBottomSphere.position.y = -height / 2
    // this.innerBottomSphere.scale.y = topBottomScale
    const innerBottomPos = this.innerBottomSphere.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < innerBottomPos.count; i++) {
      innerBottomPos.setY(i, innerBottomPos.getY(i) * inflatten)
    }
    innerBottomPos.needsUpdate = true
    this.innerBottomSphere.geometry.computeVertexNormals()

    /** 统一到 group */
    this.group.add(
      this.outerCylinder, this.outerTopSphere, this.outerBottomSphere,
      this.innerCylinder, this.innerTopSphere, this.innerBottomSphere
    )
  }

  /** 修改颜色 & 透明度 */
  setColor(color: THREE.ColorRepresentation, opacity?: number) {
    const mats = [
      this.outerCylinder.material,
      this.innerCylinder.material,
      this.outerTopSphere.material,
      this.outerBottomSphere.material,
      this.innerTopSphere.material,
      this.innerBottomSphere.material
    ] as THREE.MeshPhysicalMaterial[]

    mats.forEach(mat => {
      mat.color.set(color)
      if (opacity !== undefined)
        mat.opacity = opacity
      mat.needsUpdate = true
    })
  }

  /** 整体缩放胶囊 */
  setScale(scale: number) {
    this.group.scale.set(scale, scale, scale)
  }
  setPosition(x: number, y: number, z: number){
    this.group.position.set(x, y, z)
  }
  public setSeleteState(color:number){
    const topMeshes = [
      this.outerTopSphere.material,
      this.innerTopSphere.material,
    ] as THREE.MeshPhysicalMaterial[]

    topMeshes.forEach(mat => {
      mat.color.set(color)
      mat.needsUpdate = true
    })
  }
  getObject3D() {
    return this.group
  }
}