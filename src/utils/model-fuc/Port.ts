/**
 * @Author: Travis
 * @Date: 2025-11-26 15:43:15
 * @Description: 管道端口类，用于管道直接连接和管道变化时更新连接的后续管道
 * @LastEditTime: 2025-11-26 15:43:15
 * @LastEditors: Travis
 */
import * as THREE from 'three';
import { connectPipes } from '../three-fuc/index';

export class Port {
  name: string;
  parent: any;
  localPos: THREE.Vector3;
  localDir: THREE.Vector3;
  connected: Port | null = null;
  // isUpdate: boolean;
  updateLocal: Function;
  // pickMesh: THREE.Mesh

  constructor(
    parent: any,
    name: string,
    localPos: THREE.Vector3,
    localDir: THREE.Vector3
  ) {
    this.parent = parent;
    this.name = name;
    this.localPos = localPos.clone();
    this.localDir = localDir.clone().normalize();
    // this.isUpdate = false;
    this.updateLocal = () => {
    }
  }

  getPortInfo() {
    return {
      pos: this.localPos.clone(),
      dir: this.localDir.clone(),
    };
  }

  connectTo(other: Port) {
    // this.updateLocal()
    connectPipes(
      this.parent.getObject3D(),
      this.getPortInfo(),
      other.parent.getObject3D(),
      other.getPortInfo()
    );
    this.connected = other;
    other.connected = this;
    // this.updateFollowTransform()
  }

  onParentTransformChanged(){
    if(!this.connected) return
    this.updateLocal()
    this.connected.updateLocal();
    this.updateFollowTransform();
    // this.isUpdate = true
  }

  updateFollowTransform(){
    // console.log('updateFollowTransform===>',this)
    connectPipes(
      this.connected!.parent.getObject3D(),
      this.connected!.getPortInfo(),
      this.parent.getObject3D(),
      this.getPortInfo(),
    );
    this.connected!.parent.notifyPortsUpdated();
    // 调整完之后, other port parent 也发生了变化
    // 继续向下递归
    // this.onParentTransformChanged();
  }
}