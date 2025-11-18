/**
 * @Author: Travis
 * @Date: 2025-11-14 13:29:07
 * @Description: 定义空心管模型
 * @LastEditTime: 2025-11-14 13:29:07
 * @LastEditors: Travis
 */


import * as THREE from 'three';

export interface HollowPipeOptions {
  diameter: number;     // 外径
  thickness: number;    // 壁厚
  length: number;       // 管长（沿 Y 轴）
  color?: string | number | THREE.Color;
  radialSegments?: number;
  metalness?: number;
  roughness?: number;
  id?: string | number;
  position: {x: number; y: number; z: number} | THREE.Vector3;
  rotation: {x:number,y:number,z:number};
//   emissive?: number;
}

export class HollowPipe {
    public group: THREE.Group;
    private outerMesh?: THREE.Mesh;
    private innerMesh?: THREE.Mesh;
    private params: Required<HollowPipeOptions>;
    private outerMat: THREE.MeshStandardMaterial;
    private innerMat: THREE.MeshStandardMaterial;
    private topCap?: THREE.Mesh;
    private bottomCap?: THREE.Mesh;

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
            id: options.id || '',
            position: options.position ?
                new THREE.Vector3(options.position.x,options.position.y,options.position.z) 
                : defaults.position,
            rotation: options.rotation ?? defaults.rotation,
            // emissive: params.emissive ?? defaults.emissive,
        };

        this.group = new THREE.Group();
        this.group.userData = {...options};
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
        this.group.rotation.set(this.params.rotation.x,this.params.rotation.y,this.params.rotation.z);
        // this.group.add(new THREE.AxesHelper(0.3));
        this.group.updateMatrixWorld(true);
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
    setLength(length: number) {
        this.params.length = length;
        this.build();
    }

    // 设置颜色（接受 hex / string / THREE.Color）
    setColor(color: string | number | THREE.Color) {
        this.params.color = color;
        this.outerMat.color = new THREE.Color(color as any);
        this.innerMat.color = new THREE.Color(color as any);
        this.outerMat.needsUpdate = true;
        this.innerMat.needsUpdate = true;
    }
    getObject3d(){
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
}