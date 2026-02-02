/**
 * @Author: Travis
 * @Date: 2025-01-19
 * @Description: 模型基类,整合所有模型的共同属性和方法
 * @LastEditTime: 2025-01-19
 * @LastEditors: Travis
 */

import * as THREE from "three";
import { Port } from "./Port";
import { Flange } from "./Flange";
import { materialCache } from "../three-fuc/MaterialCache";

/**
 * 所有模型类的基类,提供共同属性和方法
 */
export abstract class BaseModel {
  // 共同属性
  public type: string = '';
  public id!: string; // 在 initBaseModel 中初始化
  public group!: THREE.Group;
  public portList: Port[] = [];
  public flanges: {flange: Flange, offset?: number[]}[] = [];
  public activeFlange: {flange: Flange, offset?: number[]} | null = null;
  public rotateAxis: 'X' | 'Y' | 'Z' = 'X';
  public _initQuat: THREE.Quaternion = new THREE.Quaternion();

  // 可选的材质属性(子类可以覆盖)
  protected material?: THREE.Material;

  // 网格模型列表,用于直接管理所有需要设置颜色的mesh
  protected meshList: THREE.Mesh[] = [];

  /**
   * 初始化基类属性
   * @param groupName 组名称
   * @param userData 用户数据
   * @param id 可选的ID，如果传入则使用传入的ID，否则随机生成
   */
  protected initBaseModel(groupName: string, userData?: any, id?: string) {
    // 如果传入了id则使用传入的id，否则随机生成
    this.id = id || String(Math.random()).slice(4);
    this.group = new THREE.Group();
    this.group.name = groupName;
    if (userData) {
      this.group.userData = userData;
    }
    // 初始化时清空meshList
    this.meshList = [];
  }

  /**
   * 添加网格模型到meshList
   * @param mesh 要添加的网格模型
   */
  protected addMesh(mesh: THREE.Mesh | THREE.Mesh[]): void {
    if (Array.isArray(mesh)) {
      this.meshList.push(...mesh);
    } else {
      this.meshList.push(mesh);
    }
  }

  /**
   * 清除meshList(通常在重建模型时调用)
   */
  protected clearMeshList(): void {
    this.meshList.length = 0;
  }

  /**
   * 获取Three.js对象
   */
  public getObject3D(): THREE.Group {
    return this.group;
  }

  /**
   * 根据类型获取端口列表
   */
  public getPort(type: string): Port[] {
    return this.portList.filter((item: Port) => item.type.includes(type));
  }

  /**
   * 根据ID查找法兰
   */
  public findFlange(id: string): {flange: Flange, offset?: number[]} | undefined {
    return this.flanges.find(item => item.flange.id === id);
  }

  // 根据点击模型时的UUID查找法兰
  public findFlangeByUUID(uuid: string): {flange: Flange, offset?: number[]} | undefined {
    console.log(this.flanges)
    return this.flanges.find(item => item.flange.getObject3D().uuid === uuid);
  }

  /**
   * 设置激活的法兰
   */
  public setActiveFlange = (id: string) => {
    console.log('BaseModel setActiveFlange====>')
    this.activeFlange = null;
    this.flanges.forEach((item) => {
      if (item.flange.getObject3D().uuid === id) {
        this.activeFlange = item;
        this.activeFlange.flange.setColor('#42b883');
      } else {
        item.flange.setColor('#d6d5e3');
      }
    });
  }

  /**
   * 设置选中状态
   */
  public setSeleteState(): void {
    this.setColor(0x005bac);
  }

  /**
   * 设置未选中状态
   */
  public setUnseleteState(): void {
    this.setColor(0xd6d5e3);
  }

  /**
   * 设置模型颜色(基类实现,子类可覆盖)
   * 优先使用meshList数组,如果没有则遍历group
   */
  public setColor(color: number | string = 0x005bac): void {
    if (this.material) {
      this.material = materialCache.getMeshMaterial(color);
      this.material.needsUpdate = true;
    }
    
    // 优先使用meshList数组直接设置颜色(性能更好)
    if (this.meshList.length > 0) {
      const mat = materialCache.getMeshMaterial(color);
      this.meshList.forEach((mesh) => {
        if (mesh && (mesh as any).isMesh && mesh.material !== undefined) {
          (mesh as any).material = mat;
        }
      });
    } else {
      // 如果没有meshList,则遍历group(向后兼容)
      if (this.group) {
        this.group.traverse((child: any) => {
          if (child && (child as any).isMesh && child.material) {
            const mat = materialCache.getMeshMaterial(color);
            (child as any).material = mat;
          }
        });
      }
    }
  }

  /**
   * 通知所有已连接的端口更新
   */
  public notifyPortsUpdated(): void {
    for (const port of this.portList) {
      if (port.connected && port.isConnected) {
        port.onParentTransformChanged();
      }
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 断开所有端口连接
    this.portList.forEach((port: Port) => {
      if (port.connected) {
        port.connected.connected = null;
        port.connected.isConnected = false;
        port.connected = null;
        port.isConnected = false;
      }
    });

    // 清理meshList中的几何体和材质
    this.meshList.forEach((mesh) => {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    this.clearMeshList();

    // 清理group中剩余的几何体和材质(处理未添加到meshList的对象)
    if (this.group) {
      this.group.traverse((child: any) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // 清理材质
    if (this.material) {
      this.material.dispose();
    }
  }

  /**
   * 创建法兰(抽象方法,子类必须实现)
   */
  protected abstract createFlange(diameter?: number): Flange;

  /**
   * 初始化端口列表(子类实现)
   */
  protected abstract initPortList(): void;
}
