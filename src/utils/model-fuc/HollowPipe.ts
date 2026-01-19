/**
 * @Author: Travis
 * @Date: 2025-11-14 13:29:07
 * @Description: 定义空心管模型
 * @LastEditTime: 2025-11-14 13:29:07
 * @LastEditors: Travis
 */

import * as THREE from 'three';
import { Port } from './Port';
import { Flange } from './Flange';
import { flangeBaseOptions, pipeBaseOptions } from '@/assets/js/modelBaseInfo';
import { materialCache } from '../three-fuc/MaterialCache';
import { BaseModel } from './BaseModel';

export interface HollowPipeOptions {
  diameter: number;     // 外径
  thickness: number;    // 壁厚
  length: number;       // 管长（沿 Y 轴）
  color?: string | number | number[];
  radialSegments?: number;
  metalness?: number;
  roughness?: number;
//   emissive?: number;
}

export class HollowPipe extends BaseModel {
    private outerMesh?: THREE.Mesh;
    private innerMesh?: THREE.Mesh;
    private outerMat: THREE.Material;
    private innerMat: THREE.Material;
    private topCap?: THREE.Mesh;
    private bottomCap?: THREE.Mesh;
    private baseLength: number;
    public params: Required<HollowPipeOptions>;
    public newLength: number;
    
    constructor(options: any) {
        super();
        this.type = 'Pipe';
        const defaults = Object.assign(pipeBaseOptions,{
            color: 0xa698a6,
            radialSegments: 32,
            metalness: 0.3,
            roughness: 0.4,
            ...options
        });
        this.params = Object.assign({},defaults)
        this.baseLength = this.params.length;
        this.newLength = this.params.length;
        this.initBaseModel('Pipe', {...this.params},  options?.id || '');
        this.outerMat = materialCache.getMeshMaterial(this.params.color);
        this.innerMat = materialCache.getMeshMaterial(this.params.color);
        this.material = this.outerMat;

        this.build();
        this.initPortList();
    }

    private validateParams() {
        if (this.params.diameter <= 0) throw new Error('diameter must be > 0');
        if (this.params.length <= 0) throw new Error('length must be > 0');
        const r = this.params.diameter / 2;
        if (this.params.thickness <= 0 || this.params.thickness >= r) {
            throw new Error('thickness must be > 0 and < radius (diameter/2)');
        }
    }

    private build() {
        this.validateParams();
        
        // 只移除并清理 meshList 中的网格，保留 flanges 等其他对象
        this.meshList.forEach((mesh) => {
            if (mesh && mesh.geometry) {
                mesh.geometry.dispose();
            }
            if (mesh && mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m: THREE.Material) => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
            this.group.remove(mesh);
        });
        this.clearMeshList(); // 重建时清空 meshList

        const innerRadius = this.params.diameter / 2;
        const outerRadius = innerRadius + this.params.thickness;
        const height = this.params.length;
        const radialSegments = this.params.radialSegments;

        // 外圆柱（无端盖）
        const outerGeom = new THREE.CylinderGeometry(
            outerRadius,
            outerRadius,
            height,
            radialSegments,
            1,
            true
        );
        // 内圆柱（无端盖），作为内表面，法线朝向内（我们使用 BackSide）
        const innerGeom = new THREE.CylinderGeometry(
            innerRadius,
            innerRadius,
            height,
            radialSegments,
            1,
            true
        );

        // 默认 CylinderGeometry 的轴线在 Y 轴，中心在原点，符合要求
        this.outerMesh = new THREE.Mesh(outerGeom, this.outerMat);
        this.innerMesh = new THREE.Mesh(innerGeom, this.innerMat);
        // this.outerMesh.userData.canInteractive = true
        // 配置阴影
        this.outerMesh.castShadow = false;
        this.outerMesh.receiveShadow = false;
        this.innerMesh.castShadow = false;
        this.innerMesh.receiveShadow = false;

        this.group.add(this.outerMesh);
        this.group.add(this.innerMesh);
        
        // 添加到 meshList
        if (this.outerMesh) this.addMesh(this.outerMesh);
        if (this.innerMesh) this.addMesh(this.innerMesh);
        
        const ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, radialSegments, 1);

        // 顶端封口，法线朝 +Y
        this.topCap = new THREE.Mesh(ringGeom.clone(), this.outerMat);
        this.topCap.rotation.x = -Math.PI / 2; // +Z -> +Y
        this.topCap.position.y = height / 2;
        this.topCap.castShadow = false;
        this.topCap.receiveShadow = false;
        this.group.add(this.topCap);
        if (this.topCap) this.addMesh(this.topCap);

        // 底端封口，法线朝 -Y
        this.bottomCap = new THREE.Mesh(ringGeom.clone(), this.outerMat);
        this.bottomCap.rotation.x = Math.PI / 2; // +Z -> -Y
        this.bottomCap.position.y = -height / 2;
        this.bottomCap.castShadow = false;
        this.bottomCap.receiveShadow = false;
        this.group.add(this.bottomCap);
        if (this.bottomCap) this.addMesh(this.bottomCap);
        
                
        // this.group.add(new THREE.AxesHelper(0.3));
        // this.group.updateMatrixWorld(true);
    }

    // 设置内径（直径）
    setDiameter(diameter: number) {
        this.params.diameter = diameter;
        this.build();
    }

    // 设置壁厚
    setThickness(thickness: number) {
        this.params.thickness = thickness;
        this.build();
    }

    // 设置长度
    setLength(scale: number) {
        // console.log('setLength===>', scale);
        let mouseDownWorldPos = new THREE.Vector3()
        this.newLength = Math.floor(scale * this.baseLength * 100) / 100;
        let oldLength = this.params.length;
        this.group.getWorldPosition(mouseDownWorldPos);
        const delta = (this.newLength - oldLength) / 2;
        // console.log('delta',delta)
        this.params.length = this.newLength;
        this.build();
        const q = new THREE.Quaternion();
        this.group.getWorldQuaternion(q);
        const localOffset = new THREE.Vector3(0, delta, 0);
        const worldOffset = localOffset.applyQuaternion(q);

        // 以 mouseDown 时记录的世界位置为基准，加上 worldOffset 得到目标世界位置
        const targetWorldPos = mouseDownWorldPos.clone().add(worldOffset);

        // 转换为附着对象父节点的本地坐标并赋值，避免控件下次计算把对象移动到原点
        const parent = this.group.parent || this.group;
        const localPos = parent.worldToLocal(targetWorldPos.clone());
        this.group.position.copy(localPos);
        this.updateFlanges()
        this.group.scale.set(1, 1, 1);
        this.group.updateMatrixWorld(true);
        this.notifyPortsUpdated()
    }

    // 设置颜色（接受 hex / string / THREE.Color）
    public setColor(color: number | string = 0x005bac) {
        this.params.color = color;
        // 使用基类的 setColor，它会自动使用 meshList
        super.setColor(color);
        // 更新材质引用
        this.outerMat = materialCache.getMeshMaterial(color);
        this.innerMat = materialCache.getMeshMaterial(color);
        this.material = this.outerMat;
    }
    // 可选：销毁，释放资源
    public dispose() {
        // 清理材质引用
        if (this.outerMat) {
            this.outerMat.dispose();
        }
        if (this.innerMat) {
            this.innerMat.dispose();
        }
        // 调用基类的 dispose 方法进行清理（会清理 meshList 中的所有 mesh）
        super.dispose();
    }
    setSeleteState(){
        this.setColor(0x005bac)
    }
    setUnseleteState(){
        this.setColor(0xdee2e6)
    }
    protected createFlange(): Flange {
        let obj = {
            ...flangeBaseOptions,
            drawDiameter: this.params.diameter,
            actualDiameter: this.params.diameter,
        }
        return new Flange(obj);
    }

    protected initPortList() {
        let port1 = new Port(
            this,
            'main',
            'in',
            new THREE.Vector3(0,-this.params.length/2,0),
            new THREE.Vector3(0,-1,0)
        )
        
        this.portList.push(port1)
        let flange1 = this.createFlange()
        let flangeMesh1 = flange1.getObject3D()
        flange1.setPort(port1)
        this.group.add(flangeMesh1)
        flangeMesh1.position.set(0,-this.params.length/2 + flange1.params.length/2,0)
        this.flanges.push({flange:flange1})
        port1.updateLocal = () =>{
            port1.localPos = new THREE.Vector3(0,-this.params.length/2,0)
            port1.localDir = new THREE.Vector3(0,-1,0)
            flangeMesh1.position.set(0,-this.params.length/2 + flange1.params.length/2,0)
            // console.log(port1)
        }
        let port2 = new Port(
            this,
            'main',
            'out',
            new THREE.Vector3(0,this.params.length/2,0),
            new THREE.Vector3(0,1,0)
        )
        this.portList.push(port2)
        let flange2 = this.createFlange()
        let flangeMesh2 = flange2.getObject3D()
        flange2.setPort(port2)
        this.group.add(flangeMesh2)
        flangeMesh2.position.set(0,this.params.length/2 - flange2.params.length/2,0)
        this.flanges.push({flange:flange2})
        port2.updateLocal = () => {
            port2.localPos = new THREE.Vector3(0,this.params.length/2,0)
            port2.localDir = new THREE.Vector3(0,1,0)
            flangeMesh2.position.set(0,this.params.length/2 - flange2.params.length/2,0)
        }
    }
    updateFlanges(){
        let flange1 = this.flanges[0]
        let flangeMesh1 = flange1.flange.getObject3D()
        flangeMesh1.position.set(0,-this.params.length/2+flange1.flange.params.length/2,0)
        flange1.flange.getPort()!.updateLocal()
        let flange2 = this.flanges[1]
        let flangeMesh2 = flange2.flange.getObject3D()
        flangeMesh2.position.set(0,this.params.length/2 - flange2.flange.params.length/2,0)
        flange2.flange.getPort()!.updateLocal()
    }
}