<template>
  <div id="canvs-box" @click.stop="onMouseUpCanvs"  @contextmenu.stop="onRightClick"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { onBeforeRouteLeave } from 'vue-router'
import { useProjectStore } from '@/store/project';
import * as THREE from "three";
import { TransparentBox } from '@/utils/model-fuc/TransparentBox'
import { CylinderWithBase } from '@/utils/model-fuc/CylinderWithBase'
import { CapsuleWithThickness } from '@/utils/model-fuc/CapsuleWithThickness'
import { HollowPipe } from '@/utils/model-fuc/HollowPipe'
import { HollowBend } from '@/utils/model-fuc/HollowBend'
import { TeePipe } from '@/utils/model-fuc/TeePipe'
import { HollowLTube } from "@/utils/model-fuc/HollowLTube";
import { ReducerPipe } from "@/utils/model-fuc/ReducerPipe";
import { CrossPipe } from "@/utils/model-fuc/CrossPipe";
import { PumpModel } from "@/utils/model-fuc/PumpModel";
// import { TransparentBox_1 } from '@/utils/model-fuc/ThickBox_1'
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//@ts-ignore
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
//@ts-ignore
import { ViewHelper } from "@/assets/js/three/ViewHelper";
import { disposeObject, findRootGroup } from "@/utils/three-fuc";
import { Port } from "@/utils/model-fuc/Port";
import { PortScheduler } from "@/utils/tool/PortUpdateDispatcher";
import { ValveModel } from "@/utils/model-fuc/ValveModel";
import { materialCache } from '@/utils/three-fuc/MaterialCache';
import { SphereChamber } from "@/utils/model-fuc/SphereChamber";
  const projectStore = useProjectStore()
  const emits = defineEmits(["showMenu"])

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
  //标注边界框辅助对象
  let markBoundaryHelper: THREE.Box3Helper | null = null;
  let markBoundaryBox: THREE.Box3 = new THREE.Box3();
  //标注文本标签组
  let markLabelGroup: THREE.Group | null = null;
  //模型
  let modelArr: any = [];

  let isShadow: boolean = false;
  let dirLight: THREE.DirectionalLight;
  let modelThreeObj: THREE.Object3D = new THREE.Object3D();
  let isLightHelper: boolean = false;
  let isInitOver: boolean = false;
  let axisLabels: {worldPos:THREE.Vector3,lastScreen:{x:number,y:number}}
  let pendingLabelUpdate: boolean = false
  // let interactiveModel = new THREE.Object3D() as THREE.Object3D | null;
  let isTransforming = false; // 解决结束控制的时候,鼠标弹起会触发一次点击而选中别的模型
  // 缓存 rect 值，避免频繁的 DOM 查询
  let cachedRect: DOMRect | null = null;
  let rectCacheTime = 0;
  const RECT_CACHE_DURATION = 100; // 100ms 缓存
  // 保存 TransformControls 的监听器引用，以便正确清理
  let currentTransformListeners: {
    objectChange?: () => void;
    mouseDown?: () => void;
    mouseUp?: () => void;
  } = {};
  // 保存 OrbitControls 的监听器引用
  let onOrbitChangeHandler: (() => void) | null = null;
  // 保存 TransformControls 的 dragging-changed 监听器引用
  let onDraggingChangedHandler: ((event: any) => void) | null = null;
  onMounted( async () => {
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
    initTransControls();
    initLight();
    initHelper();
    initThreeObj();

    //实时渲染
    animate();
    // 窗口变化
    window.addEventListener("resize", onWindowResize, false);

    isInitOver = true;
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
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    // console.log(camera)
  };
  const initRender = () => {
    //创建渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true, // true/false表示是否开启反锯齿
      alpha: true, // true/false 表示是否可以设置背景色透明
      precision: "mediump", // highp/mediump/lowp 表示着色精度选择
      premultipliedAlpha: false, // true/false 表示是否可以设置像素深度（用来度量图像的分辨率）
      preserveDrawingBuffer: false, // true/false 表示是否保存绘图缓冲
      stencil: false, // false/true 表示是否使用模板字体或图案
      //z-fighting
      logarithmicDepthBuffer: false,
    });
    renderer.autoClear = false
    renderer.setSize(cvSizes.width, cvSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // renderer.toneMapping = THREE.ACESFilmicToneMapping; //色调映射
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = false; //渲染开启阴影
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
    onOrbitChangeHandler = () => {
      // 只在菜单可见时更新标签位置，避免不必要的计算
      if (!projectStore.menuVisiable || pendingLabelUpdate) return;
      pendingLabelUpdate = true;
      requestAnimationFrame(() => {
        updateAxisLabels();
        pendingLabelUpdate = false;
      });
    };
    orbit.addEventListener("change", onOrbitChangeHandler);
  };
  const initLight = () => {
    //环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    // 创建 DirectionalLight
    dirLight = new THREE.DirectionalLight(0xffffff, 1);


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
  const initTransControls = () => {
    // let pipeObj: any = null;
    //创建变换控制器
    transformControls = new TransformControls(camera, renderer.domElement);
    onDraggingChangedHandler = (event: any) => {
      orbit.enabled = !event.value;
    };
    transformControls.addEventListener("dragging-changed", onDraggingChangedHandler);
    transformControls.setSize(0.4);
    const gizmo = transformControls.getHelper();
    scene.add( gizmo );
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
    // sceneHelpers.add();

    //创建网格地面
    gridHelper = new THREE.GridHelper(20, 20, 0x494949, 0xcccccc);
    // sceneHelpers.add(gridHelper);

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
    planeMesh = new THREE.Mesh(geometry, material);

    // 使平面接收阴影
    planeMesh.receiveShadow = isShadow;
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.y = -0.01;
    sceneHelpers.add(planeMesh);

    const gridGroup = new THREE.Group();
    gridGroup.add(gridHelper);
    // gridGroup.add(planeMesh);

    scene.add(gridGroup);

    //小窗口的坐标系
    viewHelper = new ViewHelper(camera, canvasBox);
  };

  const initThreeObj = () => {
    scene.add(modelThreeObj);
    modelThreeObj.name = "modelThreeObj";
  };

  // 更新标签方向，使其始终面向相机
  const updateLabelDirections = () => {
    if (markLabelGroup && markLabelGroup.visible) {
      markLabelGroup.children.forEach((child) => {
        if (child instanceof THREE.Sprite) {
          child.lookAt(camera.position);
        }
      });
    }
  };

  const animate = () => {
    renderer.setViewport(0, 0, cvSizes.width, cvSizes.height);
    // renderer.setScissor(0, 0, cvSizes.width, cvSizes.height);
    // renderer.setScissorTest(false);

    // renderer.clear()
    PortScheduler.flush();
    // 更新标签方向
    updateLabelDirections();
    renderer.render(scene, camera);
    renderer.clearDepth()

    viewHelper.render(renderer);
    orbit.update();

    requestAnimationFrameId = requestAnimationFrame(animate);
  }

  const onWindowResize = () => {
    cvSizes.height = canvasBox.clientHeight;
    cvSizes.width = canvasBox.clientWidth;
    camera.aspect = cvSizes.width / cvSizes.height; //摄像机像素比更新
    camera.updateProjectionMatrix(); //更新摄像机的矩阵
    renderer.setSize(cvSizes.width, cvSizes.height); //重新设置渲染器大小
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // 窗口大小改变时清除 rect 缓存，确保下次获取正确的尺寸
    cachedRect = null;
  };

  const onRightClick = (event: MouseEvent) => {
    if (!isInitOver) return;
    
    const el = document.getElementById("canvs-box");
    if (el == null) return;
    mouseVec.x = (event.offsetX / el.clientWidth) * 2 - 1;
    mouseVec.y = -(event.offsetY / el.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);

    let arr = [...modelArr]
    // console.log("arr===>", arr);
    let intersectsModel = raycaster.intersectObjects(arr, true);
    // console.log("intersectsModel===>", intersectsModel);
    
    if (intersectsModel.length == 0) {
      transformControls.detach();
      return;
    }
    // 判断是否点击交互对象
    let model:any = intersectsModel.find((ele:any) => 
      ele.object.userData.canInteractive
    )?.object
    if(!model) {
      model = findRootGroup(intersectsModel[0].object)
    }
    console.log("model===>", model);
    if(model && (model.name == 'flange-model' || model.name == "Valve")){
      // console.log(projectStore.activeClass)
      let selectFlange = projectStore.activeClass.findFlangeByUUID(model.uuid)
      // console.log(selectFlange)
      if(!selectFlange) return
      let port:Port = selectFlange.flange.getPort()
      // console.log("port===>", port);
      if(port && port.isConnected) return
      projectStore.activeClass?.setActiveFlange(model.uuid)
      projectStore.activeFlange = selectFlange
      projectStore.menuVisiable = true

      let scenePos = model.localToWorld(model.position.clone())
      let screenPos = worldToScreen(scenePos);
      axisLabels = {
        worldPos: scenePos,
        lastScreen: screenPos
      }
      projectStore.menuPos = {x:screenPos.x,y:screenPos.y}
      // console.log(axisLabels)
    }
  }

  const onMouseUpCanvs = (event: MouseEvent) => {
    if (!isInitOver) return;
    const el = document.getElementById("canvs-box");
    if (el == null) return;
    mouseVec.x = (event.offsetX / el.clientWidth) * 2 - 1;
    mouseVec.y = -(event.offsetY / el.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);
    let arr = [...modelArr]
    let intersectsModel = raycaster.intersectObjects(arr, true);
    // console.log("intersectsModel===>", intersectsModel );
    projectStore.menuVisiable = false
    if (isTransforming) return;
    if (intersectsModel.length == 0) {
      transformControls.detach();
      return;
    }
    
    // 获取点击模型的顶级group
    const self = intersectsModel[0]?.object;
    console.log("self====>", self);
    if (!self) return;
    if(self?.type == 'Mesh'){
      const parentGroup = findRootGroup(self);
      console.log("parentGroup===>", parentGroup);
      if(!parentGroup) return
      projectStore.findCurClass(parentGroup!.uuid)
      projectStore.activeClass?.setSeleteState(self.name)
      // console.log('projectStore.activeClass===>',projectStore.activeClass)
      if(parentGroup?.userData.isTransform){
        // transformControls.attach(parentGroup);
        setTransformModeToScale(parentGroup)
      }else if (parentGroup?.userData.isRotation){
        setTransformModeToRotate(parentGroup)
      }else{
        // transformControls.detach()
      }
      if(parentGroup.name == 'AuxScene'){
        setTransformMode(parentGroup)
      }
    }else{
      // console.log("self===>", self);
      // transformControls.detach()
    }
  }

  const removeTransformListener = () => {
    // 移除之前保存的监听器
    if (currentTransformListeners.objectChange) {
      transformControls.removeEventListener("objectChange", currentTransformListeners.objectChange);
      currentTransformListeners.objectChange = undefined;
    }
    if (currentTransformListeners.mouseDown) {
      transformControls.removeEventListener("mouseDown", currentTransformListeners.mouseDown);
      currentTransformListeners.mouseDown = undefined;
    }
    if (currentTransformListeners.mouseUp) {
      transformControls.removeEventListener("mouseUp", currentTransformListeners.mouseUp);
      currentTransformListeners.mouseUp = undefined;
    }
  }

  const onKeyDown = (e:KeyboardEvent) => { 
    if(e.key === 'w'){
      transformControls.setMode('translate');
    }else if(e.key === 'e'){
      transformControls.setMode('rotate');
    }else if(e.key === 'r'){
      transformControls.setMode('scale');
    }
  }
  window.addEventListener('keydown', onKeyDown)
  const setTransformMode = (group:THREE.Object3D) => {
    removeTransformListener()

    transformControls.attach(group)
    transformControls.showX = true
    transformControls.showZ = true
    transformControls.showY = true
  }
  const setTransformModeToScale = (group:THREE.Object3D) => {
    const minY = 0.15;
    removeTransformListener()
    // console.log('setTransformModeToScale',transformControls)
    let curMode = transformControls.getMode()
    if(curMode != 'scale') transformControls.setMode('scale')
    transformControls.space = 'local';

    // box3.setFromObject(group);
    // const initSize = box3.getSize(new THREE.Vector3());
    let pipeObj: any = projectStore.activeClass;
    const initSize = pipeObj.baseLength;
    // 移除 console.log 以减少性能开销
    // console.log("initSize===>", initSize);
    const minScale = minY > initSize ? 1 : minY / initSize; // 避免大于1

    transformControls.attach(group);
    
    const onObjectChange = () => {
      if(!pipeObj) return
      transformControls.object.scale.y = Math.max(minScale, transformControls.object.scale.y)
      const s = transformControls.object.scale.y;
      // console.log("s===>", s);
      if (s == 1 || s < 0) return;
      
      pipeObj.setLength(s)
      // pipeObj.length = pipeObj.params.length;
    }
    const onMouseDown = () => {
      isTransforming = true;
      projectStore.isSubmit = false
    }
    const onMouseUp = () => {
      pipeObj.baseLength = pipeObj.params.length;
      setTimeout(() => {
        isTransforming = false;
      }, 100);
    };
    // 保存监听器引用
    currentTransformListeners.objectChange = onObjectChange;
    currentTransformListeners.mouseDown = onMouseDown;
    currentTransformListeners.mouseUp = onMouseUp;
    //绑定对象的数据变更时触发
    transformControls.addEventListener("objectChange", onObjectChange);
    transformControls.addEventListener("mouseDown", onMouseDown);
    transformControls.addEventListener("mouseUp", onMouseUp);
    transformControls.showX = false
    transformControls.showZ = false
    transformControls.showY = true
    
  }

  const setTransformModeToRotate = (group:THREE.Object3D) => {
    removeTransformListener()
    // console.log('setTransformModeToRotate',transformControls)
    let curMode = transformControls.getMode()
    if(curMode != 'rotate') transformControls.setMode('rotate')
    transformControls.space = 'local';
    transformControls.attach(group);
    let pipeObj = projectStore.modelList.find(
      (item: any) => item.getObject3D().uuid === group.uuid
    );
    const onObjectChange = () => {
      if(!pipeObj) return
      
      pipeObj.notifyPortsUpdated()
    }
    const onMouseDown = () => {
      isTransforming = true;
      projectStore.isSubmit = false
    }

    const onMouseUp = () => {
      // 触发旋转角度显示更新
      projectStore.rotationUpdateKey++
      setTimeout(() => {
        isTransforming = false;
      }, 100);
    };

    // 保存监听器引用
    currentTransformListeners.objectChange = onObjectChange;
    currentTransformListeners.mouseDown = onMouseDown;
    currentTransformListeners.mouseUp = onMouseUp;
    
    transformControls.addEventListener("objectChange", onObjectChange);
    transformControls.addEventListener("mouseDown", onMouseDown);
    transformControls.addEventListener("mouseUp", onMouseUp);
    let axis = pipeObj.rotateAxis
    // console.log("axis===>", axis);
    if(axis == 'X'){
      transformControls.showY = false
      transformControls.showZ = false
      transformControls.showX = true
    }else if(axis == 'Y'){
      transformControls.showY = true
      transformControls.showZ = false
      transformControls.showX = false
    }else{
      transformControls.showY = false
      transformControls.showX = false
      transformControls.showZ = true
    }
  }

  const destroyScene = () => {
    try {
      cancelAnimationFrame(requestAnimationFrameId);
      
      // 清理 TransformControls 的监听器
      removeTransformListener();
      if (transformControls && onDraggingChangedHandler) {
        transformControls.removeEventListener("dragging-changed", onDraggingChangedHandler);
        transformControls.dispose();
        onDraggingChangedHandler = null;
      }
      
      // 清理 OrbitControls 的监听器
      if (orbit && onOrbitChangeHandler) {
        orbit.removeEventListener("change", onOrbitChangeHandler);
        orbit.dispose();
        onOrbitChangeHandler = null;
      }
      
      // 清理标签组
      if (markLabelGroup) {
        while (markLabelGroup.children.length > 0) {
          const child = markLabelGroup.children[0];
          if (child instanceof THREE.Sprite) {
            //@ts-ignore
            child.material.map?.dispose();
            //@ts-ignore
            child.material.dispose();
          }
          markLabelGroup.remove(child);
        }
        markLabelGroup = null;
      }
      
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

      if(renderer)
        renderer.domElement = null;
      renderer?.forceContextLoss();
      renderer?.dispose();
      scene = null;
      camera = null;
      orbit = null;
      transformControls = null;
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

  const destroyMaterials = () => {
    materialCache.disposeAll()
  }

  // 创建文本标签Sprite
  const createTextSprite = (text: string, color: string = '#ffff00') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    // 设置字体和大小
    const fontSize = 16;
    context.font = `normal ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 测量文本宽度
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const padding = 8;
    
    // 设置画布尺寸
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;
    
    // 重新设置字体（因为canvas尺寸改变后需要重置）
    context.font = `normal ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 绘制文本
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // 创建Sprite材质
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      toneMapped: false
    });
    
    // 创建Sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    // 根据相机距离调整大小
    sprite.scale.set(0.5, 0.5, 1);
    
    return sprite;
  };

  // 更新标注边界框
  const updateMarkBoundary = () => {
    // 计算所有实体的边界框
    markBoundaryBox.makeEmpty();
    
    // 遍历所有模型，计算包围所有实体的边界框
    if (modelArr.length > 0) {
      modelArr.forEach((item: any) => {
        if (item) {
          // 更新模型的世界矩阵，确保边界框计算准确
          item.updateMatrixWorld(true);
          // 扩展边界框以包含当前实体
          const itemBox = new THREE.Box3().setFromObject(item);
          if (!itemBox.isEmpty()) {
            markBoundaryBox.union(itemBox);
          }
        }
      });
      
      // 如果边界框有效，创建或更新辅助对象
      if (!markBoundaryBox.isEmpty()) {
        // 获取边界框尺寸并存储到 projectInfo.pocSize
        const size = markBoundaryBox.getSize(new THREE.Vector3());
        const center = markBoundaryBox.getCenter(new THREE.Vector3());
        const length = Math.round(size.x * 1000) / 1000;
        const width = Math.round(size.z * 1000) / 1000;
        const height = Math.round(size.y * 1000) / 1000;
        
        projectStore.projectInfo.pocSize.length = length;
        projectStore.projectInfo.pocSize.width = width;
        projectStore.projectInfo.pocSize.height = height;
        
        // 如果辅助对象不存在，创建它
        if (!markBoundaryHelper) {
          markBoundaryHelper = new THREE.Box3Helper(markBoundaryBox, 0xffff00); // 黄色
          //@ts-ignore
          markBoundaryHelper.material.depthTest = false;
          //@ts-ignore
          markBoundaryHelper.material.transparent = true;
          sceneHelpers.add(markBoundaryHelper);
          // 确保 sceneHelpers 只被添加一次到场景
          if (!sceneHelpers.parent) {
            scene.add(sceneHelpers);
          }
        } else {
          // 更新现有辅助对象的边界框
          markBoundaryHelper.box.copy(markBoundaryBox);
        }
        markBoundaryHelper.visible = true;
        
        // 创建或更新文本标签
        if (!markLabelGroup) {
          markLabelGroup = new THREE.Group();
          sceneHelpers.add(markLabelGroup);
        }
        
        // 清除旧的标签
        while (markLabelGroup.children.length > 0) {
          const child = markLabelGroup.children[0];
          if (child instanceof THREE.Sprite) {
            //@ts-ignore
            child.material.map?.dispose();
            //@ts-ignore
            child.material.dispose();
          }
          markLabelGroup.remove(child);
        }
        
        // 计算偏移量，使标签稍微远离边界框的边
        const offset = 0.1;
        
        // X方向（length）- 标注在前面的底边中点
        const lengthLabel = createTextSprite(`${length}`, '#ffff00');
        if (lengthLabel) {
          // 前面底边的中点：(center.x, min.y, max.z)
          lengthLabel.position.set(center.x, markBoundaryBox.max.y + offset, markBoundaryBox.max.z + offset);
          markLabelGroup.add(lengthLabel);
        }
        
        // Z方向（width）- 标注在右面的底边中点
        const widthLabel = createTextSprite(`${width}`, '#ffff00');
        if (widthLabel) {
          // 右面底边的中点：(max.x, min.y, center.z)
          widthLabel.position.set(-markBoundaryBox.max.x + offset, markBoundaryBox.max.y + offset, center.z);
          markLabelGroup.add(widthLabel);
        }
        
        // Y方向（height）- 标注在前面的左边中点
        const heightLabel = createTextSprite(`${height}`, '#ffff00');
        if (heightLabel) {
          // 前面左边的中点：(min.x, center.y, max.z)
          heightLabel.position.set(markBoundaryBox.min.x - offset, center.y, markBoundaryBox.max.z + offset);
          markLabelGroup.add(heightLabel);
        }
        markLabelGroup.visible = true;
      } else {
        // 边界框为空，隐藏辅助对象并重置尺寸
        if (markBoundaryHelper) {
          markBoundaryHelper.visible = false;
        }
        if (markLabelGroup) {
          markLabelGroup.visible = false;
        }
        projectStore.projectInfo.pocSize.length = 0;
        projectStore.projectInfo.pocSize.width = 0;
        projectStore.projectInfo.pocSize.height = 0;
      }
    } else {
      // 没有模型，隐藏辅助对象并重置尺寸
      if (markBoundaryHelper) {
        markBoundaryHelper.visible = false;
      }
      if (markLabelGroup) {
        markLabelGroup.visible = false;
      }
      projectStore.projectInfo.pocSize.length = 0;
      projectStore.projectInfo.pocSize.width = 0;
      projectStore.projectInfo.pocSize.height = 0;
    }
  };

  // 显示标注
  const showMark = (isShow: boolean) => { 
    if (isShow) {
      // 更新边界框并显示
      updateMarkBoundary();
    } else {
      // 隐藏标注
      if (markBoundaryHelper) {
        markBoundaryHelper.visible = false;
      }
      if (markLabelGroup) {
        markLabelGroup.visible = false;
      }
    }
  };

  const worldToScreen = (point: THREE.Vector3) => {
    camera.updateMatrixWorld();
    
    const vector = point.clone();
    vector.project(camera);

    // 使用缓存的 rect，减少 DOM 查询 , getBoundingClientRect 性能开销很大尽量使用缓存的值
    const now = Date.now();
    if (!cachedRect || (now - rectCacheTime) > RECT_CACHE_DURATION) {
      cachedRect = renderer.domElement.getBoundingClientRect();
      rectCacheTime = now;
    }
    const rect = cachedRect!;

    const x = (vector.x + 1) / 2 * rect.width;
    const y = (-vector.y + 1) / 2 * rect.height;

    return { x, y };
  }


  const updateAxisLabels = () => { 
    // 只在菜单可见时更新，避免不必要的计算
    if (!axisLabels || !projectStore.menuVisiable) return;
    
    const THRESHOLD_PX = 1;
    const p = worldToScreen(axisLabels.worldPos);
    const last = axisLabels.lastScreen;
    
    // 只有当位置变化超过阈值时才更新，减少 Vue 响应式更新
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > THRESHOLD_PX) {
      axisLabels.lastScreen = {x:p.x,y:p.y}
      projectStore.menuPos = {x:p.x,y:p.y}
    }
  }

  onUnmounted(() => {
    // projectStore.clearModelList()
    // projectStore.$dispose()
    window.removeEventListener("resize", onWindowResize, false);
    window.removeEventListener("keydown", onKeyDown);
    // sessionStorage.removeItem('project')
    // projectStore.clearModelList()
    destroyMaterials()
    destroyScene();
    console.log('注销编辑器')
  });

  
  onBeforeRouteLeave(() => {
    // projectStore.clearModelList()
    // projectStore.$dispose()
    destroyMaterials()
    destroyScene();
    window.removeEventListener("resize", onWindowResize, false);
    window.removeEventListener("keydown", onKeyDown);
    // sessionStorage.removeItem('project')
    console.log('离开路由')
  })

  // 在组件挂载后注册 popstate 监听（也支持在页面层级 navigation 时清理）
  // window.addEventListener('popstate', onPopState)

  /**
   * @description: 添加模型
   * @param type 模型类型 type: 0-正方形 1-圆柱体形 2-胶囊形 
   * 
  */ 
  const addChamberModel = (options:any) => {
    console.log("main_addChamberModel===>",options);
    let initCls :any = {}
    let group = {} as THREE.Group
    let type = options.cType
    modelArr.forEach((child: THREE.Object3D) => {
      if (child?.name == 'objchamber') {
        scene.remove(child)
        disposeObject(child);
      }
    })
    if( type == '0') {
      initCls = new TransparentBox(options)
    }else if (type == '1'){
      initCls = new CylinderWithBase(options)
    } else if (type == '2'){
      initCls = new CapsuleWithThickness(options)
    }else if( type == '3' ){
      initCls = new SphereChamber(options)
    }
    if(!group || !initCls){
      console.error('group-err || box-err');
    }
    group = initCls.getObject3D()
    initCls.params.cType = type
    let model_box = box3.setFromObject(group)
    const minY = model_box.min.y;
    group.position.y -= minY;
    // group.matrixAutoUpdate(true)
    group.updateMatrixWorld(true)
    // box.setSeleteState(0x72b0e6)
    scene.add(group)
    modelArr[0] = group
    projectStore.modelList[0] = initCls
    projectStore.findCurClass(group!.uuid)
    projectStore.activeClass.setSeleteState('top')
    // 如果标注边界框正在显示，则更新边界
    if (markBoundaryHelper && markBoundaryHelper.visible) {
      updateMarkBoundary();
    }
    console.log(initCls)
  }
  /**
   * @description: 添加管道
   * @param option 
  */
  const addPipeModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter()
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let pipe = new HollowPipe(options)
      connectFnc(pipe)
    }catch(err){
      console.error("addPipeModel-err",err)
      return
    }
  }

  const addBendModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter()
      console.log("addBendModel===>", diameter);
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      const box = new HollowBend(options);
      connectFnc(box)
    }catch(err){ 
      console.error("addBendModel-err",err)
      return
    }
  }

  /**
   * @type =0的时候连接主管道，=1的时候连接分支管道
  */
  const addTeeModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter() 
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let box = new TeePipe(options)
      if(options.type == '1'){
        box.resetPortList()
      }
      connectFnc(box)
    }catch(err){
      console.error("addTeeModel-err",err)
      return
    }
  }

  // 添加直角斜切管
  const addLTubeModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter() 
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let box = new HollowLTube(options)
      connectFnc(box)
    }catch(err){
      console.error("addLTubeModel-err",err)
      return
    }
  }

  // 添加异径管
  const addReducerModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter() 
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let box = new ReducerPipe(options)
      connectFnc(box)
    }catch(err){
      console.error("addReducerModel-err",err)
      return
    }
  }

  // 添加十字四通管
  const addCrossPipeModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter() 
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let box = new CrossPipe(options)
      connectFnc(box)
    }catch(err){
      console.error("addGLBModel-err",err)
      return
    }
  }

  const calculatePrevDiameter = () => {
    if(!projectStore.activeClass) return 0;
    let diameter = projectStore.activeClass.activeFlange.flange.params.actualDiameter
    diameter = Math.round(diameter * 10000) / 10000
    // console.log('diameter=====>',diameter)
    return diameter
  }

  const addGLBModel = async (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter() 
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let box = new PumpModel(options)
      console.log('box',box)
      // scene.add(box.getObject3D())
      connectFnc(box)
    }catch(err){
      console.error("addGLBModel-err",err)
      return
    }
  }

  const addValveModel = (options:any) => {
    try{
      options = options ? options : {}
      let diameter = calculatePrevDiameter() 
      if(!diameter) {
        throw new Error('管道内径错误')
      }
      options.diameter = diameter
      let box = new ValveModel(options)
      scene.add(box.getObject3D())
      connectFnc(box)
    }catch(err){
      console.error("addValveModel-err",err)
      return
    }
  }

  const connectFnc = (initClass:any) => {
    console.log('connectFnc===>',initClass)
    const activeClass = projectStore?.activeClass || null
    try{
      console.log('connectFnc activeClass===>',activeClass)
      if(!activeClass) return;
      let group = initClass.getObject3D()
      // console.log(initClass.getPort('in'))
      let in_port = initClass.getPort('in')[0]
      // let out_portList: any = []
      // console.log(activeClass.activeFlange.flange.getObject3D().position)
      let out_port :any= activeClass.activeFlange.flange.getPort()

      // console.log('connectFnc===>',in_port,out_port)
      if (!out_port || !in_port) {
        // console.log('outOffset===>',out_port)
        throw new Error("not find out_port or in_port");
      }
      if(out_port.connected !== null){
        throw new Error("outlet-model is already connected");
      }
      out_port.updateLocal()
      in_port.updateLocal()
      in_port.connectTo(out_port)
      // 连接后更新矩阵，确保旋转状态是最新的
      group.updateMatrixWorld(true)
      scene.add(group)
      modelArr.push(group)
      // console.log(projectStore.modelList)
      projectStore.addClass(initClass)
      // 记录连接后的初始旋转状态（用于计算后续旋转角度）
      if(initClass.rotateAxis.length){
        initClass._initQuat = group.quaternion.clone()
        console.log('_initQuat set:', initClass._initQuat)
      }
      // 如果标注边界框正在显示，则更新边界
      if (markBoundaryHelper && markBoundaryHelper.visible) {
        updateMarkBoundary();
      }
    }catch(err){
      console.error("connectFnc-err",err,initClass,activeClass)
      return
    }
  } 

  const delModel = (uuid:string, visited = new Set<string>()) => {
    // console.log("delModel===>", uuid);
    if (!uuid || visited.has(uuid)) return;
    visited.add(uuid);
    let curClass = projectStore.modelList.find((item:any) => item.getObject3D().uuid == uuid)
    if(!curClass) return
    // scene.remove(curClass.getObject3D())
    // 先移除当前模型的transformControls
    if(transformControls)
      transformControls.detach()
    
    // 断开所有端口连接，避免引用泄漏
    let portList:Port[] = curClass.portList || []
    portList.forEach((p:Port) => {
      if(p.connected && p.isConnected){
        const parentObj = p.connected.parent.getObject3D();
        if (parentObj) delModel(parentObj.uuid, visited);
      }
      if(p.connected) {
        // 断开连接
        p.connected.connected = null;
        p.connected.isConnected = false;
        p.connected = null;
        p.isConnected = false;
      }
    });

    // 调用模型的 dispose 方法（如果存在），清理 Worker 等资源
    if (typeof curClass.dispose === 'function') {
      curClass.dispose();
    }

    const obj = curClass.getObject3D();
    // 从父节点移除
    if (obj.parent) {
      obj.parent.remove(obj);
    } else {
      scene.remove(obj);
    }
    modelArr = modelArr.filter((g: any) => g.uuid !== obj.uuid);
    const idx = projectStore.modelList.findIndex((item: any) => item.getObject3D().uuid === uuid);
    if (idx > -1) projectStore.modelList.splice(idx, 1);

    // 如果标注边界框正在显示，则更新边界
    if (markBoundaryHelper && markBoundaryHelper.visible) {
      updateMarkBoundary();
    }

    // 清理几何体和材质
    obj.traverse((child: any) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  defineExpose({
    addChamberModel,
    addPipeModel,
    addBendModel,
    addTeeModel,
    addLTubeModel,
    addReducerModel,
    // addStpModel,
    addCrossPipeModel,
    delModel,
    addGLBModel,
    addValveModel,
    connectFnc,
    showMark
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
  overflow: hidden;
  // opacity: 0.1;
  // user-select: ;
}
</style>