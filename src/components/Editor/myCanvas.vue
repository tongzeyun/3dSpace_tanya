<template>
  <div id="canvs-box"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import * as THREE from "three";

//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//@ts-ignore
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
//@ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
//@ts-ignore
import { ViewHelper } from "@/assets/js/three/ViewHelper";

  let scene: THREE.Scene | any;
  let camera: THREE.OrthographicCamera | any;
  let renderer: THREE.WebGLRenderer | any;
  let orbit: OrbitControls | any;
  // let mixerObj: any = [];
  //坐标系
  let transformControls: TransformControls | any;
  //画布盒
  let canvasBox: HTMLElement | any;
  let cvSizes: any;
  //射线
  let raycaster: THREE.Raycaster = new THREE.Raycaster();
  let mouseVec: THREE.Vector2 = new THREE.Vector2(0, 0);
  let requestAnimationFrameId: any;
  //场景辅助工具对象
  let sceneHelpers: THREE.Object3D = new THREE.Object3D();
  let box3Helper: THREE.Box3Helper;
  let box3: THREE.Box3;
  let viewHelper: any;
  let gridHelper: THREE.GridHelper;
  let planeMesh: THREE.Mesh;
  let keyValue: string = "";
  //模型
  let modelArr: any = [];

  let isShadow: boolean = true;
  let dirLight: THREE.DirectionalLight;
  let modelThreeObj: THREE.Object3D = new THREE.Object3D();
  let isLightHelper: boolean = false;
  onMounted(() => {
    initApplication();
  })

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
    // initTransControls();
    initLight();
    initHelper();
    initThreeObj();

    //实时渲染
    animate();
    // 窗口变化
    window.addEventListener("resize", onWindowResize, false);
  }

  const initScene = () => {
    //创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);
  };
  const initCamera = () => {
    //创建相机
    camera = new THREE.PerspectiveCamera(
      45,
      cvSizes.width / cvSizes.height,
      0.1,
      10000
    );
    camera.position.set(0, 12, 30);
    camera.lookAt(0, 0, 0);
    // console.log(camera)
  };
  const initRender = () => {
    //创建渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true, // true/false表示是否开启反锯齿
      alpha: true, // true/false 表示是否可以设置背景色透明
      precision: "highp", // highp/mediump/lowp 表示着色精度选择
      premultipliedAlpha: false, // true/false 表示是否可以设置像素深度（用来度量图像的分辨率）
      preserveDrawingBuffer: true, // true/false 表示是否保存绘图缓冲
      stencil: false, // false/true 表示是否使用模板字体或图案
      //z-fighting
      logarithmicDepthBuffer: true,
    });
    renderer.autoClear = false
    renderer.setSize(cvSizes.width, cvSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // renderer.toneMapping = THREE.ACESFilmicToneMapping; //色调映射
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true; //渲染开启阴影
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; //地图阴影类型  不支持模糊
    
    canvasBox.appendChild(renderer.domElement);
  };

  const initOrbitControls = () => {
    //创建轨道控制器
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
  const initLight = () => {
    //环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    // 创建 DirectionalLight
    dirLight = new THREE.DirectionalLight(0xffffff, 1);

    //store
    // projectStore.projectInfo.lightInfo.color = 0xffffff
    // projectStore.projectInfo.lightInfo.intensity = 0.5

    // 启用阴影投射
    dirLight.castShadow = isShadow;

    // 配置阴影参数
    dirLight.shadow.mapSize.width = 512; // 阴影贴图的宽度
    dirLight.shadow.mapSize.height = 512; // 阴影贴图的高度
    dirLight.shadow.camera.near = 0.01; // 阴影相机的近裁剪面
    dirLight.shadow.camera.far = 60; // 阴影相机的远裁剪面
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = -30;
    dirLight.shadow.camera.bottom = 30;

    // 设置 DirectionalLight 的阴影相机的位置和方向
    dirLight.position.set(0, 30, 0); // 设置光源位置
    // dirLight.position.set(0, 1, 0); // 设置光源位置

    if (isLightHelper) {
      const helper = new THREE.DirectionalLightHelper(dirLight, 100);
      scene.add(helper);

      const chelper = new THREE.CameraHelper(dirLight.shadow.camera);
      scene.add(chelper);
    }

    scene.add(dirLight);
  };
  const initHelper = () => {
    //box 辅助线框盒
    box3 = new THREE.Box3();
    box3Helper = new THREE.Box3Helper(box3);
    //@ts-ignore
    box3Helper.material.depthTest = false;
    //@ts-ignore
    box3Helper.material.transparent = true;
    box3Helper.visible = false;
    sceneHelpers.add(box3Helper);
    sceneHelpers.add(transformControls);

    //创建网格地面
    gridHelper = new THREE.GridHelper(20, 20, 0x494949, 0xcccccc);
    sceneHelpers.add(gridHelper);
    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(20, 20);

    // 创建透明的平面材质
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      // opacity: 0.5,
      // side:THREE.DoubleSide
    });

    // 创建平面网格
    planeMesh = new THREE.Mesh(geometry, material);

    // 使平面接收阴影
    planeMesh.receiveShadow = isShadow;
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.y = -0.01;
    sceneHelpers.add(planeMesh);

    scene.add(sceneHelpers);

    //小窗口的坐标系
    viewHelper = new ViewHelper(camera, canvasBox);
  };

  const initThreeObj = () => {
    scene.add(modelThreeObj);
    modelThreeObj.name = "modelThreeObj";
  };

  const animate = () => {
    renderer.setViewport(0, 0, cvSizes.width, cvSizes.height);
    renderer.setScissor(0, 0, cvSizes.width, cvSizes.height);
    renderer.setScissorTest(true);

    renderer.clear()
    renderer.render(scene, camera);
    renderer.clearDepth()

    viewHelper.render(renderer);
    orbit.update();

    requestAnimationFrameId = requestAnimationFrame(animate.bind(this));
  }

  const onWindowResize = () => {
    cvSizes.height = canvasBox.clientHeight;
    cvSizes.width = canvasBox.clientWidth;
    camera.aspect = cvSizes.width / cvSizes.height; //摄像机像素比更新
    camera.updateProjectionMatrix(); //更新摄像机的矩阵
    renderer.setSize(cvSizes.width, cvSizes.height); //重新设置渲染器大小
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const destroyScene = () => {
    try {
      cancelAnimationFrame(requestAnimationFrameId);
      // console.log("scene-destory", scene);
      scene?.traverse((child: any) => {
        if (child?.material) {
          child?.material.dispose();
        }
        if (child?.geometry) {
          child?.geometry.dispose();
        }
        child = null;
      });
      if (scene?.children?.toString())
        scene?.remove?.apply(scene, scene.children);

      renderer?.forceContextLoss();
      renderer?.dispose();
      scene = null;
      camera = null;
      orbit = null;
      renderer.domElement = null;
      renderer = null;

      let parent: HTMLElement | any = document.getElementById("canvs-box");
      if (parent?.children.length > 0) {
        parent?.removeChild(parent?.children[0]);
      }
      // projectStore.clearsObjList()
    } catch (err) {
      console.log("destroyScene-err", err);
    }
  };

  onUnmounted(() => {
    window.removeEventListener("resize", onWindowResize, false);
    destroyScene();
  });

  defineExpose({
    
  })
</script>

<style scoped lang="scss">
#canvs-box {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  // opacity: 0.1;
}
</style>