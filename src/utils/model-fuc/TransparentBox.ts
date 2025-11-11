/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义长方体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

// 主箱体类
import * as THREE from 'three'
type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
export interface FaceConfig {
  color?: number | string
  opacity?: number
}
interface TransparentBoxOptions {
  width?: number // 宽度
  height?: number // 高度
  length?: number // 长度
  thickness?: number  // 厚度
  faceConfigs?: Partial<Record<FaceName, FaceConfig>> // 面属性配置
}
export class TransparentBox {
  public width: number
  public height: number
  public length: number
  public thickness: number
  public group: THREE.Group
  public faces: Record<FaceName, THREE.Mesh>
  constructor(options: TransparentBoxOptions = {}) {
    const {
      width = 1,
      height = 1,
      length = 1,
      thickness = 0.05,
      faceConfigs = {},
    } = options

    this.width = width
    this.height = height
    this.length = length
    this.thickness = thickness

    this.group = new THREE.Group()
    this.faces = {} as Record<FaceName, THREE.Mesh>

    const defaultConfig: FaceConfig = { color: 0xd6d5e3, opacity: 0.4 }

    this.faces.front = this._createFace(
      this.width - this.thickness,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.front }
    )
    this.faces.front.position.z = this.length / 2 - this.thickness / 2

    this.faces.back = this._createFace(
      this.width - this.thickness,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.back }
    )
    this.faces.back.position.z = -this.length / 2 + this.thickness / 2

    this.faces.top = this._createFace(
      this.width + this.thickness,
      this.length,
      { ...defaultConfig, ...faceConfigs.top }
    )
    this.faces.top.rotation.x = Math.PI / 2
    this.faces.top.position.y = this.height / 2

    this.faces.bottom = this._createFace(
      this.width + this.thickness,
      this.length,
      { ...defaultConfig, ...faceConfigs.bottom }
    )
    this.faces.bottom.rotation.x = Math.PI / 2
    this.faces.bottom.position.y = -this.height / 2

    this.faces.left = this._createFace(
      this.length,
      this.height - this.thickness,
      { ...defaultConfig, ...faceConfigs.left }
    )
    this.faces.left.rotation.y = Math.PI / 2
    this.faces.left.position.x = -this.width / 2

    this.faces.right = this._createFace(
      this.length ,
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

  public resize(options: Partial<TransparentBoxOptions>) { 
    console.log('resize==>', options)
    const newW = options.width ?? this.width
    const newH = options.height ?? this.height
    const newL = options.length ?? this.length
    const newT = options.thickness ?? this.thickness

    this.width = newW
    this.height = newH
    this.length = newL
    this.thickness = newT

    const update = (mesh: THREE.Mesh, w: number, h: number, pos?: THREE.Vector3, rot?: THREE.Euler) => {
      // 更新几何体
      mesh.geometry.dispose()
      mesh.geometry = new THREE.BoxGeometry(w, h, this.thickness)
      // 保持材质并更新物理厚度（如果存在）
      const mat: any = mesh.material
      if (mat && typeof mat.thickness !== 'undefined') mat.thickness = this.thickness
      // mesh.material.needsUpdate = true
      // 复位/应用旋转与位置
      if (rot) mesh.rotation.copy(rot)
      if (pos) mesh.position.copy(pos)
    }
    // front / back
    update(this.faces.front, newW - newT, newH - newT, new THREE.Vector3(0, 0, newL / 2 - newT / 2))
    update(this.faces.back, newW - newT, newH - newT, new THREE.Vector3(0, 0, -newL / 2 + newT / 2))

    // top / bottom （旋转保持为 X 轴 90deg）
    const rotX = new THREE.Euler(Math.PI / 2, 0, 0)
    update(this.faces.top, newW + newT, newL, new THREE.Vector3(0, newH / 2, 0), rotX)
    update(this.faces.bottom, newW + newT, newL, new THREE.Vector3(0, -newH / 2, 0), rotX)

    // left / right （旋转保持为 Y 轴 90deg）
    const rotY = new THREE.Euler(0, Math.PI / 2, 0)
    update(this.faces.left, newL, newH - newT, new THREE.Vector3(-newW / 2, 0, 0), rotY)
    update(this.faces.right, newL, newH - newT, new THREE.Vector3(newW / 2, 0, 0), rotY)
    return this
  }
}





