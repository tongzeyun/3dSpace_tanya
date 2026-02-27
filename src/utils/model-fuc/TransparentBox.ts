/**
 * @Author: Travis
 * @Date: 2025-11-03 11:13:10
 * @Description: 自定义长方体模型
 * @LastEditTime: 2025-11-11 11:13:10
 * @LastEditors: Travis
 */

// 主箱体类
import * as THREE from 'three'
// import { ENUM_Box_Faces } from '../enum'
import { Flange } from './Flange'
import { Port } from './Port';
import { disposeObject } from '../three-fuc';
const chamberBaseOptions = {
  type: 'Chamber',
  cType: '0',
  width: 1,
  height: 1,
  length: 1,
  volume:1,
  thickness: 0.02,
  isRoot: true,
  isTransform: false,
  isRotation: false,
}
type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
export interface FaceConfig {
  color?: number | string
  opacity?: number,
  fId?: string[],
}
interface TransparentBoxOptions {
  width?: number // 宽度
  height?: number // 高度
  length?: number // 长度
  thickness?: number  // 厚度
  volume?: number // 体积
  faceConfigs?: Partial<Record<FaceName, FaceConfig>> // 面属性配置
}
export class TransparentBox {
  public params: Required<TransparentBoxOptions>
  public group: THREE.Group
  public faces: Record<FaceName, THREE.Mesh>
  public flanges: {flange:Flange,offset:number[]}[]
  public id: string;
  public type = 'Chamber'
  public portList: Port[] = [];
  public activeFace: THREE.Mesh | null = null
  public activeFlange: {flange:Flange,offset:number[]} | null = null
  constructor(options: any) {
    const {
      faceConfigs = {},
    } = options

    this.params = Object.assign({}, chamberBaseOptions, options)
    console.log('创建 Chamber 模型',this.params);
    this.id = options.id || String(Math.random()).slice(4)
    this.group = new THREE.Group()
    this.group.name = 'objchamber'
    this.group.userData = this.params
    this.faces = {} as Record<FaceName, THREE.Mesh>
    this.flanges = []

    // 保存选项供 build 函数使用
    this._buildOptions = {
      faceConfigs,
      flangeList: options.flangeList,
      portList: options.portList
    }

    // 调用 build 函数构建模型
    this.build()
  }

  private _buildOptions: {
    faceConfigs: any,
    flangeList?: any[],
    portList?: any[]
  } = {
    faceConfigs: {}
  }

  public build() {
    const { faceConfigs, flangeList, portList } = this._buildOptions
    const defaultConfig: FaceConfig = { color: 0xd6d5e3, opacity: 0.4 }

    // 清理旧的面
    Object.values(this.faces).forEach(face => {
      if (face && face.parent) {
        face.parent.remove(face)
      }
      if (face) {
        if (face.geometry) face.geometry.dispose()
        if (face.material) {
          if (Array.isArray(face.material)) {
            face.material.forEach(m => m.dispose())
          } else {
            face.material.dispose()
          }
        }
      }
    })
    this.faces = {} as Record<FaceName, THREE.Mesh>

    // 清理旧的法兰
    this.flanges.forEach(item => {
      const flangeObj = item.flange.getObject3D()
      if (flangeObj.parent) {
        flangeObj.parent.remove(flangeObj)
      }
      disposeObject(flangeObj)
    })
    this.flanges.length = 0
    this.portList.length = 0
    const materialCache = new Map<string, THREE.MeshBasicMaterial>()
    const getOrCreateMaterial = (cfg: FaceConfig): THREE.MeshBasicMaterial => {
      // console.log('getOrCreateMaterial==>', cfg)
      const key = `${cfg.color ?? defaultConfig.color}_${cfg.opacity ?? defaultConfig.opacity}`
      if (!materialCache.has(key)) {
        materialCache.set(key, new THREE.MeshBasicMaterial({
          color: cfg.color ?? 0xffffff,
          transparent: true,
          opacity: cfg.opacity ?? defaultConfig.opacity ?? 0.4,
          side: THREE.FrontSide,
        }))
      }
      return materialCache.get(key)!
    }

    const faceConfigList: Array<{name: FaceName, config: FaceConfig, w: number, h: number, l: number, pos: [number, number, number]}> = [
      {
        name: 'front',
        config: { ...defaultConfig, ...faceConfigs.front, fId: faceConfigs.front?.fId ? [...faceConfigs.front.fId] : [] },
        w: this.params.width - 2*this.params.thickness,
        h: this.params.height-this.params.thickness,
        l: this.params.thickness,
        pos: [0, 0, this.params.length / 2 - this.params.thickness / 2]
      },
      {
        name: 'back',
        config: { ...defaultConfig, ...faceConfigs.back, fId: faceConfigs.back?.fId ? [...faceConfigs.back.fId] : [] },
        w: this.params.width - 2*this.params.thickness,
        h: this.params.height-this.params.thickness,
        l: this.params.thickness,
        pos: [0, 0, -this.params.length / 2 + this.params.thickness / 2]
      },
      {
        name: 'top',
        config: { ...defaultConfig, ...faceConfigs.top, fId: faceConfigs.top?.fId ? [...faceConfigs.top.fId] : [] },
        w: this.params.width,
        h: this.params.thickness,
        l: this.params.length,
        pos: [0, this.params.height / 2, 0]
      },
      {
        name: 'bottom',
        config: { ...defaultConfig, ...faceConfigs.bottom, fId: faceConfigs.bottom?.fId ? [...faceConfigs.bottom.fId] : [] },
        w: this.params.width,
        h: this.params.thickness,
        l: this.params.length,
        pos: [0, -this.params.height / 2, 0]
      },
      {
        name: 'left',
        config: { ...defaultConfig, ...faceConfigs.left, fId: faceConfigs.left?.fId ? [...faceConfigs.left.fId] : [] },
        w: this.params.thickness,
        h: this.params.height - this.params.thickness,
        l: this.params.length,
        pos: [-this.params.width / 2 + this.params.thickness / 2, 0, 0]
      },
      {
        name: 'right',
        config: { ...defaultConfig, ...faceConfigs.right, fId: faceConfigs.right?.fId ? [...faceConfigs.right.fId] : [] },
        w: this.params.thickness,
        h: this.params.height - this.params.thickness,
        l: this.params.length,
        pos: [this.params.width / 2 - this.params.thickness / 2, 0, 0]
      }
    ]

    // 保存配置到 params
    faceConfigs.front = faceConfigList[0].config
    faceConfigs.back = faceConfigList[1].config
    faceConfigs.top = faceConfigList[2].config
    faceConfigs.bottom = faceConfigList[3].config
    faceConfigs.left = faceConfigList[4].config
    faceConfigs.right = faceConfigList[5].config

    faceConfigList.forEach(({name, config, w, h, l, pos}) => {
      const material = getOrCreateMaterial(config).clone()
      const geometry = new THREE.BoxGeometry(w, h, l)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = name
      mesh.position.set(pos[0], pos[1], pos[2])
      this.faces[name] = mesh
    })

    const faceArray = Object.values(this.faces) as THREE.Mesh[]
    this.group.add(...faceArray)
    
    this.params.faceConfigs = {...faceConfigs}

    // 批量处理法兰列表
    if(flangeList && Array.isArray(flangeList) && flangeList.length > 0){
      const flangesByFace = new Map<FaceName, any[]>()
      
      flangeList.forEach((flangeData: any) => {
        const facename = flangeData.flange?.params?.faceName
        if(!facename) return
        
        if(!flangesByFace.has(facename)) {
          flangesByFace.set(facename, [])
        }
        flangesByFace.get(facename)!.push(flangeData)
      })

      // 按面批量处理
      flangesByFace.forEach((flangeDataList, facename) => {
        // 每个面只切换一次状态
        this.setSeleteState(facename)
        
        flangeDataList.forEach((flangeData: any) => {
          const obj = {
            id: flangeData.flange.id,
            ...flangeData.flange.params,
          }
          this.addOutletModel(obj)
          this.setOutletOffset(flangeData.offset[0], flangeData.offset[1])
        })
      })
    }

    // 处理端口列表
    if(portList && Array.isArray(portList) && portList.length > 0){
      portList.forEach((p: any) => {
        const curFlange = this.flanges.find((f: any) => f.flange.id == p.parent) 
        if(!curFlange) return
        const port = curFlange.flange.getPort()
        if(port) {
          port.id = p.id
        }
      })
    }

    this.group.updateMatrixWorld(true)
  }


  public getObject3D(): THREE.Group {
    return this.group
  }

  public setFaceProperty(faceName: FaceName, cfg: FaceConfig) {
    const face :any= this.faces[faceName]
    if (!face) return

    if (cfg.color !== undefined) {
      if (typeof cfg.color === 'number') {
        face.material.color.setHex(cfg.color)
      } else {
        face.material.color.set(cfg.color as any)
      }
    }
    if (cfg.opacity !== undefined) {
      face.material.opacity = cfg.opacity
    }
  }

  // 缓存的选中材质
  private _selectedMaterial: THREE.MeshBasicMaterial | null = null
  
  private _getSelectedMaterial(color: number = 0x72b0e6): THREE.MeshBasicMaterial {
    if (!this._selectedMaterial || (this._selectedMaterial.color as THREE.Color).getHex() !== color) {
      if (this._selectedMaterial) {
        this._selectedMaterial.dispose()
      }
      this._selectedMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.FrontSide,
      })
    }
    return this._selectedMaterial
  }

  public setSeleteState(name:FaceName,color:number = 0x72b0e6){
    if(!name) return
    
    const face: any = this.faces[name]
    if (face) {
      face.material = this._getSelectedMaterial(color)
    }
    
    this.setActiveFace(name)
  }
  public setActiveFace(name:FaceName){
    if(!name) return
    this.activeFace = this.faces[name]
  }
  // 缓存的默认材质
  private _defaultMaterial: THREE.MeshBasicMaterial | null = null
  
  private _getDefaultMaterial(): THREE.MeshBasicMaterial {
    if (!this._defaultMaterial) {
      this._defaultMaterial = new THREE.MeshBasicMaterial({
        color: 0xd6d5e3,
        transparent: true,
        opacity: 0.4,
        side: THREE.FrontSide,
      })
    }
    return this._defaultMaterial
  }

  public setUnseleteState(){
    const defaultMat = this._getDefaultMaterial()
    Object.values(this.faces).forEach((face: any) => {
      if (face) {
        face.material = defaultMat
      }
    })
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
    const newW = options.width ?? this.params.width
    const newH = options.height ?? this.params.height
    const newL = options.length ?? this.params.length
    const newT = options.thickness ?? this.params.thickness

    this.params.width = newW
    this.params.height = newH
    this.params.length = newL
    this.params.thickness = newT

    const update = (mesh: THREE.Mesh, w: number, h: number, l:number ,pos?: THREE.Vector3,) => {
      // const prevQuat = mesh.quaternion.clone()
      // 更新几何体
      mesh.geometry.dispose()
      mesh.geometry = new THREE.BoxGeometry(w, h, l)
      const mat: any = mesh.material
      if (mat && typeof mat.thickness !== 'undefined') mat.thickness = this.params.thickness
      if (pos) mesh.position.copy(pos)
    }
    // front / back
    update(this.faces.front, newW - 2*newT, newH - newT,newT,new THREE.Vector3(0, 0, newL / 2 - newT / 2))
    update(this.faces.back, newW - newT, newH - newT, newT,new THREE.Vector3(0, 0, -newL / 2 + newT / 2))

    // top / bottom （旋转保持为 X 轴 90deg）
    update(this.faces.top, newW , newT ,newL, new THREE.Vector3(0, newH / 2, 0))
    update(this.faces.bottom, newW , newT ,newL, new THREE.Vector3(0, -newH / 2, 0))

    // left / right （旋转保持为 Y 轴 90deg）
    update(this.faces.left, newT, newH - newT, newL , new THREE.Vector3(-newW / 2 + newT /2, 0, 0))
    update(this.faces.right, newT, newH - newT, newL, new THREE.Vector3(newW / 2 - newT/2, 0, 0))
    return this
  }
  public findFlangeByUUID(id:string){ 
    return this.flanges.find(item=>item.flange.getObject3D().uuid === id)
  }
  public setActiveFlange = (id:string) => {
    this.activeFlange = null
    this.flanges.forEach((item) =>{
      if(item.flange.getObject3D().uuid == id){
        this.activeFlange = item
        this.activeFlange.flange.setColor('#42b883')
      }else{
        item.flange.setColor('#d6d5e3')
      }
    })
    // console.log(this.activeFlange)
  }

  public addOutletModel = (options?: { drawDiameter?: number; actualDiameter:number ;length?: number; color?: number }) => {
    // console.log('addOutletModel==>', options)
    if(!this.activeFace) return
    let faceName = this.activeFace.name
    let obj = {
      drawDiameter: options?.drawDiameter ?? 0.12,
      actualDiameter: options?.actualDiameter ?? 0.12,
      length: options?.length ?? (this.params.thickness - 0.001),
      faceName: faceName,
    }
    obj = Object.assign(obj, options)
    let flange = new Flange(obj)
    let flangeMesh = flange.getObject3D()
    switch (faceName) {
      case 'front':
        flangeMesh.rotation.x = Math.PI / 2
        break
      case 'back':
        flangeMesh.rotation.x = -Math.PI / 2
        break
      case 'left':
        flangeMesh.rotation.z = Math.PI / 2
        break
      case 'right':
        flangeMesh.rotation.z = -Math.PI / 2
        break
      case 'bottom':
        flangeMesh.rotation.x = Math.PI
        break
    }
    
    let flangeInfo = flange.computedOutOffset()
    let port = new Port(
      flange,
      faceName,
      'out',
      flangeInfo.pos,
      flangeInfo.dir
    )
    flange.setPort(port)
    this.flanges.push({flange:flange,offset:[0.5,0.5]})
    this.portList.push(port)
    this.activeFace.add(flangeMesh)
    // 移除立即更新矩阵，改为在 build 函数最后统一更新
    // flangeMesh.updateMatrixWorld(true)
    this.setActiveFlange(flangeMesh.uuid)
    // return flangeMesh
  }

  public setOutletOffset = (offsetX: number, offsetY: number) => {
    // console.log("setOutletOffset===>", offsetX, offsetY);
    if(isNaN(offsetX) || isNaN(offsetY)) return
    
    let outlet: THREE.Object3D | any = this.activeFlange!.flange.getObject3D();
    let port = this.activeFlange!.flange.getPort();
    if(!port) return;
    
    let faceMesh: THREE.Mesh | any = outlet.parent
    // console.log("faceMesh===>", faceMesh ,outlet);
    // console.log("faceMesh===>", outlet.position.clone());
    if(!faceMesh){
      console.warn("outlet not found")
      return
    }
    if (!outlet) {
      console.warn("outlet not found on face");
      return;
    }
    this.activeFlange!.offset = [offsetX, offsetY]
    if(faceMesh.name =='top' || faceMesh.name =='bottom'){
      const width = this.params.width ?? 1;
      const height = this.params.length ?? 1;
      const baseX = width / 2;
      const baseY = height / 2;
      // console.log('width,height',width,height)
      outlet.position.set(offsetX -baseX,0,offsetY - baseY);
    }else if(faceMesh.name =='left' || faceMesh.name =='right'){
      const width = this.params.length  ?? 1;
      const height = this.params.height ?? 1;
      const baseX = width / 2;
      const baseY = height / 2;
      outlet.position.set(0,offsetY-baseY,offsetX-baseX);
    }else if(faceMesh.name =='front' || faceMesh.name =='back'){
      const width = this.params.width  ??1;
      const height = this.params.height ?? 1;

      const baseX = width / 2;
      const baseY = height / 2;
      outlet.position.set(offsetX-baseX,offsetY-baseY,0);
    }
    this.notifyPortsUpdated(port)
  }

  public delFlange (){
    disposeObject(this.activeFlange?.flange.getObject3D() as THREE.Object3D)
    this.activeFlange?.flange.getObject3D().parent?.remove(this.activeFlange.flange.getObject3D())
    this.flanges = this.flanges.filter(item=>item.flange.id!=this.activeFlange?.flange.id)
    this.portList = this.portList.filter(port=>port.parent.id != this.activeFlange?.flange.id)
    this.activeFlange = null
    // console.log('delFlange',this.portList)
  }
  
  /**
   * 获取当前激活窗口的端口信息
   * */ 
  public getPort = () => {
    if(!this.activeFlange) return
    return this.activeFlange.flange.getPort()
  }
  notifyPortsUpdated(port: Port) {
    if(!port) return
    port.onParentTransformChanged()
  }

  // 模型销毁时调用
  dispose() {
    // 断开所有端口连接
    this.portList.forEach((port: Port) => {
      if (port.connected) {
        port.connected.connected = null;
        port.connected.isConnected = false;
        port.connected = null;
        port.isConnected = false;
      }
    });
    // 清理所有面的几何体和材质
    Object.values(this.faces).forEach((face: THREE.Mesh) => {
      if (face.geometry) {
        face.geometry.dispose();
      }
      if (face.material) {
        // 不要释放共享的默认材质和选中材质
        if (face.material !== this._defaultMaterial && face.material !== this._selectedMaterial) {
          if (Array.isArray(face.material)) {
            face.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            face.material.dispose();
          }
        }
      }
    });
    // 清理法兰
    this.flanges.forEach((item) => {
      const flangeObj = item.flange.getObject3D();
      if (flangeObj.geometry) {
        flangeObj.geometry.dispose();
      }
      if (flangeObj.material) {
        if (Array.isArray(flangeObj.material)) {
          flangeObj.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          flangeObj.material.dispose();
        }
      }
    });
    // 清理缓存的材质
    if (this._defaultMaterial) {
      this._defaultMaterial.dispose();
      this._defaultMaterial = null;
    }
    if (this._selectedMaterial) {
      this._selectedMaterial.dispose();
      this._selectedMaterial = null;
    }
  }
}





