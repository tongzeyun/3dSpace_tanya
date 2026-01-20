/**
 * @Author: Travis
 * @Date: 2025-12-17 10:22:38
 * @Description: 生成三通模型Worker
 * @LastEditTime: 2025-12-17 10:22:38
 * @LastEditors: Travis
 */
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

self.onmessage = async (e) => {
  const { mainOuter, mainInner, branchOuter, branchInner , length} = e.data;
  // console.log(mainOuter, mainInner, branchOuter, branchInner)
  // console.log('length===>',length)

  const mainOuterGeo =  THREE.CylinderGeometry.fromJSON(mainOuter);
  const mainInnerGeo =  THREE.CylinderGeometry.fromJSON(mainInner);
  mainOuterGeo.rotateZ(Math.PI / 2);
  mainInnerGeo.rotateZ(Math.PI / 2);

  const branchOuterGeo = THREE.CylinderGeometry.fromJSON(branchOuter);
  const branchInnerGeo = THREE.CylinderGeometry.fromJSON(branchInner);
  branchOuterGeo.translate(0, -length / 2, 0);
  branchInnerGeo.translate(0, -length / 2, 0);
  // console.log(mainOuterGeo, mainInnerGeo, branchOuterGeo, branchInnerGeo)

  const mainCSG = CSG.subtract(
    new THREE.Mesh(mainOuterGeo),
    new THREE.Mesh(mainInnerGeo)
  );

  const branchCSG = CSG.subtract(
    new THREE.Mesh(branchOuterGeo),
    new THREE.Mesh(branchInnerGeo)
  );
  const finalCSG = CSG.union(mainCSG, branchCSG);
  // console.log('finalCSG===>',finalCSG)
  // const finalMesh = (CSG as any).toMesh(finalCSG,new THREE.Matrix4(),new THREE.MeshStandardMaterial());

  // const json = finalMesh.geometry.toJSON();

  self.postMessage(finalCSG.toJSON());
};