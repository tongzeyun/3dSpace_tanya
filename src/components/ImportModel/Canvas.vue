<template>
  <div id="canvs-box"></div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import * as THREE from "three";
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//@ts-ignore
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { disposeObject, loadGLBModel } from "@/utils/three-fuc";
//@ts-ignore
import { ViewHelper } from "@/assets/js/three/ViewHelper";
  // 暴露给父组件的方法
  const emit = defineEmits<{
    modelLoaded: [model: THREE.Object3D];
    scaleUpdated: [scale: number];
  }>();


  let scene: THREE.Scene | any;
  let camera: THREE.PerspectiveCamera | any;
  let renderer: THREE.WebGLRenderer | any;
  let orbit: OrbitControls | any;
  let transformControls: TransformControls | any;
  let canvasBox: HTMLElement | any;
  let cvSizes: any;
  let requestAnimationFrameId: any;

  let viewHelper: any;

  // 当前加载的模型
  let currentModel: THREE.Object3D | null = null;
  let modelGroup: THREE.Group | null = null;

  // 法兰球体数组
  let flangeSpheres: THREE.Mesh[] = [];

  // 射线检测
  let raycaster: THREE.Raycaster = new THREE.Raycaster();
  let mouseVec: THREE.Vector2 = new THREE.Vector2(0, 0);

  onMounted(() => {
    initApplication();
  });

  onUnmounted(() => {
    if (requestAnimationFrameId) {
      cancelAnimationFrame(requestAnimationFrameId);
    }
    window.removeEventListener("resize", onWindowResize);
    if (renderer && renderer.domElement) {
      renderer.domElement.removeEventListener("click", onCanvasClick);
    }
    if (currentModel) {
      disposeObject(currentModel);
    }
    flangeSpheres.forEach(sphere => {
      disposeObject(sphere);
    });
  });

  const initApplication = () => {
    canvasBox = document.getElementById("canvs-box");
    cvSizes = {
      width: canvasBox.clientWidth,
      height: canvasBox.clientHeight,
    };
    initScene();
    initCamera();
    initRender();
    initOrbitControls();
    initTransControls();
    initLight();
    initHelper();
    animate();
    window.addEventListener("resize", onWindowResize, false);
  };

  const initScene = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);
    
    // 创建模型容器组
    modelGroup = new THREE.Group();
    modelGroup.name = "modelGroup";
    scene.add(modelGroup);
  };

  const initCamera = () => {
    camera = new THREE.PerspectiveCamera(
      45,
      cvSizes.width / cvSizes.height,
      0.1,
      10000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  };

  const initRender = () => {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.autoClear = false;
    renderer.setSize(cvSizes.width, cvSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasBox.appendChild(renderer.domElement);
  };

  const initOrbitControls = () => {
    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, 0, 0);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.1;
    orbit.maxPolarAngle = Math.PI;
    orbit.minPolarAngle = 0;
    orbit.minDistance = 0.1;
    orbit.maxDistance = 100;
    orbit.enablePan = true;
  };

  const initTransControls = () => {
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener("dragging-changed", (event: any) => {
      orbit.enabled = !event.value;
    });
    transformControls.addEventListener("change", () => {
      // 更新渲染
    });
    // scene.add(transformControls);
    const gizmo = transformControls.getHelper();
    scene.add( gizmo );
    // 添加点击事件来选择法兰球体
    renderer.domElement.addEventListener("click", onCanvasClick);
  };

  const initLight = () => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 方向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);
  };

  const initHelper = () => {
    //创建网格地面
    const gridHelper = new THREE.GridHelper(40, 40, 0x494949, 0xcccccc);
    scene.add(gridHelper);

    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(20, 20);
    // 创建透明的平面材质
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      // side:THREE.DoubleSide
    });

    // 创建平面网格
    let planeMesh = new THREE.Mesh(geometry, material);

    // 使平面接收阴影
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.y = -0.01;
    // scene.add(planeMesh);
    //小窗口的坐标系
    viewHelper = new ViewHelper(camera, canvasBox);
  };

  const animate = () => {
    renderer.setViewport(0,0,cvSizes.width, cvSizes.height);
    requestAnimationFrameId = requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
    viewHelper.render(renderer);
  };

  const onWindowResize = () => {
    cvSizes.height = canvasBox.clientHeight;
    cvSizes.width = canvasBox.clientWidth;
    camera.aspect = cvSizes.width / cvSizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(cvSizes.width, cvSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

// 设置模型材质为半透明
const setModelTransparent = (model: THREE.Object3D) => {
  model.traverse((child: any) => {
    if (child.isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        // 处理材质数组
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial || 
                mat instanceof THREE.MeshPhysicalMaterial ||
                mat instanceof THREE.MeshBasicMaterial ||
                mat instanceof THREE.MeshLambertMaterial ||
                mat instanceof THREE.MeshPhongMaterial) {
              mat.transparent = true;
              mat.opacity = 0.5;
              mat.depthWrite = false; // 避免深度问题，让内部物体可见
            }
          });
        } else {
          // 处理单个材质
          const mat = mesh.material as THREE.Material;
          if (mat instanceof THREE.MeshStandardMaterial || 
              mat instanceof THREE.MeshPhysicalMaterial ||
              mat instanceof THREE.MeshBasicMaterial ||
              mat instanceof THREE.MeshLambertMaterial ||
              mat instanceof THREE.MeshPhongMaterial) {
            mat.transparent = true;
            mat.opacity = 0.5;
            mat.depthWrite = false;
          }
        }
      }
    }
  });
};

// 加载模型并居中显示
const loadModel = async (file: File) => {
  try {
    // 清除旧模型
    if (currentModel && modelGroup) {
      disposeObject(currentModel);
      modelGroup.remove(currentModel);
      currentModel = null;
    }

    const url = URL.createObjectURL(file);
    
    // 获取文件扩展名
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    // 使用自定义加载器，传入文件扩展名
    const model = await loadGLBModel(url, { fileExtension });
    currentModel = model;
    
    // 设置模型为半透明
    setModelTransparent(model);
    
    // 居中并缩放模型
    centerModel(model);
    
    URL.revokeObjectURL(url);
    emit('modelLoaded', model);
  } catch (error) {
    throw error;
  }
};

// 居中模型并自动缩放
const centerModel = (model: THREE.Object3D) => {
  if (modelGroup) {
    modelGroup.add(model);
    
    // 先计算模型边界框（用于确定缩放比例）
    const initialBox = new THREE.Box3().setFromObject(model);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    let maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
    
    let appliedScale = 1;
    
    // 应用缩放
    if (maxDim > 1) {
      // 如果模型太大，缩放到 0.75
      const targetSize = 0.75;
      const scale = targetSize / maxDim;
      model.scale.multiplyScalar(scale);
      maxDim = targetSize;
      appliedScale = scale;
    } else if (maxDim < 0.5) {
      // 如果模型太小，放大到 0.5
      const targetSize = 0.5;
      const scale = targetSize / maxDim;
      model.scale.multiplyScalar(scale);
      maxDim = targetSize;
      appliedScale = scale;
    }
    
    // 缩放后重新计算边界框
    const box = new THREE.Box3().setFromObject(model);
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);
    
    // 将世界坐标中心转换为 modelGroup 的本地坐标
    modelGroup.worldToLocal(worldCenter);
    
    // 将模型中心移动到原点（在 modelGroup 的本地坐标系中）
    model.position.sub(worldCenter);
    
    // 通知父组件更新缩放值
    emit('scaleUpdated', appliedScale);
    
    // 调整相机位置
    const distance = maxDim * 2;
    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
    orbit.target.set(0, 0, 0);
    orbit.update();
  }
};

// 设置模型缩放
const setModelScale = (scale: number) => {
  if (currentModel) {
    currentModel.scale.set(scale, scale, scale);
  }
};

// 添加法兰球体
const addFlange = (type: 'in' | 'out', diameter: number) => {
  const radius = diameter / 2 ; // 将毫米转换为米
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const color = type === 'in' ? 0x00ff00 : 0xff0000; // 绿色进气，红色出气
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  
  // 设置用户数据
  sphere.userData.type = type;
  sphere.userData.diameter = diameter;
  sphere.userData.canInteractive = true;
  sphere.name = `flange-${type}-${flangeSpheres.length}`;
  
  // 默认位置在模型前方（如果模型存在，放在模型前方）
  if (currentModel) {
    const box = new THREE.Box3().setFromObject(currentModel);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    sphere.position.set(0 , 0, maxDim * 0.5,);
  } else {
    sphere.position.set(0, 0, 0);
  }
  
  scene.add(sphere);
  flangeSpheres.push(sphere);
  
  // 启用变换控制
  transformControls.attach(sphere);
  
  return sphere;
};

// 点击画布选择法兰球体
const onCanvasClick = (event: MouseEvent) => {
  if (!canvasBox) return;
  
  const rect = canvasBox.getBoundingClientRect();
  mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouseVec, camera);
  
  // 只检测法兰球体
  const intersects = raycaster.intersectObjects(flangeSpheres, false);
  
  if (intersects.length > 0) {
    // 选中点击的法兰球体
    const selectedSphere = intersects[0].object as THREE.Mesh;
    transformControls.attach(selectedSphere);
  } else {
    // 点击空白处，取消选择
    transformControls.detach();
  }
};


// 获取当前选中的法兰球体
const getSelectedFlange = (): THREE.Mesh | null => {
  const object = transformControls.object;
  if (object && object instanceof THREE.Mesh && flangeSpheres.includes(object)) {
    return object;
  }
  return null;
};

// 删除选中的法兰球体
const deleteSelectedFlange = (): boolean => {
  const selectedFlange = getSelectedFlange();
  if (selectedFlange) {
    // 从数组中移除
    const index = flangeSpheres.indexOf(selectedFlange);
    if (index > -1) {
      flangeSpheres.splice(index, 1);
    }
    
    // 从场景中移除
    scene.remove(selectedFlange);
    
    // 释放资源
    disposeObject(selectedFlange);
    
    // 取消选择
    transformControls.detach();
    
    return true;
  }
  return false;
};

// 定义暴露给父组件的方法
defineExpose({
  loadModel,
  setModelScale,
  addFlange,
  getSelectedFlange,
  deleteSelectedFlange,
});
</script>
<style lang="scss" scoped>
#canvs-box {
  width: 100%;
  height: 100%;
}
</style>