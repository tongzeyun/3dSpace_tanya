/**
 * @Author: Travis
 * @Date: 2025-11-14 13:29:07
 * @Description: 定义空心管模型
 * @LastEditTime: 2025-11-14 13:29:07
 * @LastEditors: Travis
 */

import * as THREE from 'three';
import { Port } from './Port';

export interface HollowPipeOptions {
  diameter: number;     // 外径
  thickness: number;    // 壁厚
  length: number;       // 管长（沿 Y 轴）
  color?: string | number | THREE.Color;
  radialSegments?: number;
  metalness?: number;
  roughness?: number;
  position: {x: number; y: number; z: number} | THREE.Vector3;
  rotation: {x:number,y:number,z:number};
//   emissive?: number;
}

export class HollowPipe {
    public group: THREE.Group;
    private outerMesh?: THREE.Mesh;
    private innerMesh?: THREE.Mesh;
    private outerMat: THREE.MeshStandardMaterial;
    private innerMat: THREE.MeshStandardMaterial;
    private topCap?: THREE.Mesh;
    private bottomCap?: THREE.Mesh;
    private baseLength: number;
    public params: Required<HollowPipeOptions>;
    public id: string;
    public type = 'Pipe'
    public portList: Port[];

    constructor(options: HollowPipeOptions) {
        const defaults = {
            color: 0xa698a6,
            radialSegments: 32,
            metalness: 0,
            roughness: 0,
            position: new THREE.Vector3(0,0,0),
            rotation: {x:0,y:0,z:0},
        };
        this.params = {
            diameter: options.diameter,
            thickness: options.thickness,
            length: options.length,
            color: options.color ?? defaults.color,
            radialSegments: options.radialSegments ?? defaults.radialSegments,
            metalness: options.metalness ?? defaults.metalness,
            roughness: options.roughness ?? defaults.roughness,
            position: options.position ?
                new THREE.Vector3(options.position.x,options.position.y,options.position.z) 
                : defaults.position,
            rotation: options.rotation ?? defaults.rotation,
            // emissive: params.emissive ?? defaults.emissive,
        };
        this.baseLength = this.params.length;
        this.group = new THREE.Group();
        this.group.userData = {...options};
        this.id = String(Math.random()).slice(4)
        this.group.name = 'Pipe'
        this.portList = []
        // this.group.userData.type = 'Pipe'
        this.outerMat = new THREE.MeshStandardMaterial({
            color: this.params.color,
            metalness: this.params.metalness,
            roughness: this.params.roughness,
            side: THREE.FrontSide,
        });

        this.innerMat = new THREE.MeshStandardMaterial({
            color: this.params.color,
            metalness: this.params.metalness,
            roughness: this.params.roughness,
            side: THREE.BackSide, // 内表面朝内
        });

        this.build();
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

        // 清理已有
        if (this.outerMesh) {
            this.outerMesh.geometry.dispose();
            this.group.remove(this.outerMesh);
        }
        if (this.innerMesh) {
            this.innerMesh.geometry.dispose();
            this.group.remove(this.innerMesh);
        }
        if (this.topCap) {
            this.topCap.geometry.dispose();
            this.group.remove(this.topCap);
        }
        if (this.bottomCap) {
            this.bottomCap.geometry.dispose();
            this.group.remove(this.bottomCap);
        }

        const outerRadius = this.params.diameter / 2;
        const innerRadius = outerRadius - this.params.thickness;
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
        this.outerMesh.castShadow = true;
        this.outerMesh.receiveShadow = true;
        this.innerMesh.castShadow = false;
        this.innerMesh.receiveShadow = true;

        this.group.add(this.outerMesh);
        this.group.add(this.innerMesh);


        const ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, radialSegments, 1);

        // 顶端封口，法线朝 +Y
        this.topCap = new THREE.Mesh(ringGeom.clone(), this.outerMat);
        this.topCap.rotation.x = -Math.PI / 2; // +Z -> +Y
        this.topCap.position.y = height / 2;
        this.topCap.castShadow = true;
        this.topCap.receiveShadow = true;
        this.group.add(this.topCap);

        // 底端封口，法线朝 -Y
        this.bottomCap = new THREE.Mesh(ringGeom.clone(), this.outerMat);
        this.bottomCap.rotation.x = Math.PI / 2; // +Z -> -Y
        this.bottomCap.position.y = -height / 2;
        this.bottomCap.castShadow = true;
        this.bottomCap.receiveShadow = true;
        this.group.add(this.bottomCap);
        
        this.group.position.copy(this.params.position);
        // this.group.rotation.set(this.params.rotation.x,this.params.rotation.y,this.params.rotation.z);
        const curRot = this.group.rotation;
        const isDefaultRotation = curRot.x === 0 && curRot.y === 0 && curRot.z === 0;
        if (isDefaultRotation && this.params.rotation) {
           this.group.rotation.set(this.params.rotation.x, this.params.rotation.y, this.params.rotation.z);
        }
        // this.group.add(new THREE.AxesHelper(0.3));
        this.group.updateMatrixWorld(true);
        // this.computedInOffset();
        // this.computedOutOffset();
        this.initPortList()
    }

    // 设置外径（直径）
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
        if(scale < 0) {
            console.error('Length must be >0')
            return;
        }
        let mouseDownWorldPos = new THREE.Vector3()
        let newLength = Math.floor(scale * this.baseLength * 100) / 100;
        this.group.getWorldPosition(mouseDownWorldPos);
        const delta = (newLength - this.params.length) / 2;
        this.params.length = newLength;
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
        
        this.group.scale.set(1, 1, 1);
        this.group.updateMatrixWorld(true);
        this.notifyPortsUpdated()
        // this.params.length = newLength;
    }

    // 设置颜色（接受 hex / string / THREE.Color）
    setColor(color: string | number | THREE.Color) {
        this.params.color = color;
        this.outerMat.color = new THREE.Color(color as any);
        this.innerMat.color = new THREE.Color(color as any);
        this.outerMat.needsUpdate = true;
        this.innerMat.needsUpdate = true;
    }
    getObject3D(){
        return this.group;
    }
    // 可选：销毁，释放资源
    dispose() {
        if (this.outerMesh) {
            this.outerMesh.geometry.dispose();
            this.group.remove(this.outerMesh);
            this.outerMesh = undefined;
        }
        if (this.innerMesh) {
            this.innerMesh.geometry.dispose();
            this.group.remove(this.innerMesh);
            this.innerMesh = undefined;
        }
        this.outerMat.dispose();
        this.innerMat.dispose();
    }
    setSeleteState(color:number = 0x005bac){
        this.setColor(color)
    }
    setUnseleteState(){
        this.setColor(0xd6d5e3)
    }
    initPortList(){
        let port1 = new Port(
            this,
            'in',
            new THREE.Vector3(0,-this.params.length/2,0),
            new THREE.Vector3(0,-1,0)
        )
        port1.updateLocal = () =>{
            port1.localPos = new THREE.Vector3(0,-this.params.length/2,0)
            port1.localDir = new THREE.Vector3(0,-1,0)
            console.log(port1)
        }
        this.portList.push(port1)
        let port2 = new Port(
            this,
            'out',
            new THREE.Vector3(0,this.params.length/2,0),
            new THREE.Vector3(0,1,0)
        )
        port2.updateLocal = () =>{
            port2.localPos = new THREE.Vector3(0,this.params.length/2,0)
            port2.localDir = new THREE.Vector3(0,1,0)
        }
        this.portList.push(port2)
    }
    // updatePortList(){
    //     // this.portList = []
    //     // this.initPortList()
    //     this.portList
    // }
    getPort(name:string){
        return this.portList.find(item=>item.name === name)
    }
    notifyPortsUpdated() {
        for (const port of this.portList) {
            if(port.connected && port.name == 'out'){
                console.log('port notifyPortsUpdated===>', port);
                // this.updatePortList()
                port.onParentTransformChanged();
            }
        }
    }
}