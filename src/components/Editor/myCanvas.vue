<template>
  <div id="canvs-box" @click.stop="onMouseUpCanvs"  @contextmenu.stop="onRightClick"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
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
  //模型
  let modelArr: any = [];

  let isShadow: boolean = false;
  let dirLight: THREE.DirectionalLight;
  let modelThreeObj: THREE.Object3D = new THREE.Object3D();
  let isLightHelper: boolean = false;
  let isInitOver: boolean = false;
  let axisLabels: {worldPos:THREE.Vector3,lastScreen:{x:number,y:number}}
  let pendingLabelUpdate: boolean = false
  let interactiveModel = new THREE.Object3D() as THREE.Object3D | null;
  onMounted( async () => {
    initApplication();
    // testFnc()
    // testFnc_1()
    
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
    const onOrbitChange = () => {
      if (pendingLabelUpdate) return;
      pendingLabelUpdate = true;
      requestAnimationFrame(() => {
        updateAxisLabels();
        pendingLabelUpdate = false;
      });
    };
    orbit.addEventListener("change", onOrbitChange);
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
  const initTransControls = () => {
    // let pipeObj: any = null;
    //创建变换控制器
    transformControls = new TransformControls(camera, renderer.domElement);
    // transformControls.minY = 0;
    // transformControls.setMode("scale");
    //关闭和打开orbit
    transformControls.addEventListener("dragging-changed", (event: any) => {
      orbit.enabled = !event.value;
    });

    // transformControls.addEventListener("change", () => {
    //   console.log('change===>')
    //   transformControls.detach();
    // })

    //绑定对象的数据变更时触发
    // transformControls.addEventListener("objectChange", () => {
    //   // if(!pipeObj) return
    //   const s = transformControls.object.scale.y;
    //   if (s == 0) return;
    //   pipeObj.setLength(s);
    //   pipeObj.length = pipeObj.params.length;
    // });
    
    // transformControls.addEventListener("mouseDown", () => {
    //   pipeObj = projectStore.modelList.find(
    //     (item: any) => item.getObject3D().uuid === transformControls.object.uuid
    //   );
    //   // pipeObj.initClass.baseLength = pipeObj.initClass.params.length;
    // });

    // transformControls.addEventListener("mouseUp", () => {
    //   // console.log("mouseUp===>",pipeMesh.position);
    //   pipeObj.baseLength = pipeObj.params.length;
    // });
    // transformControls.showX = false
    // transformControls.showZ = false
    // transformControls.setSpace('world')
    const gizmo = transformControls.getHelper();
    // sceneHelpers.add(gizmo);
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
    // gridGroup.add(gridHelper);
    // gridGroup.add(planeMesh);

    scene.add(gridGroup);

    //小窗口的坐标系
    viewHelper = new ViewHelper(camera, canvasBox);
  };

  const initThreeObj = () => {
    scene.add(modelThreeObj);
    modelThreeObj.name = "modelThreeObj";
  };

  const animate = () => {
    renderer.setViewport(0, 0, cvSizes.width, cvSizes.height);
    // renderer.setScissor(0, 0, cvSizes.width, cvSizes.height);
    // renderer.setScissorTest(false);

    // renderer.clear()
    PortScheduler.flush();
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
  };

  const onRightClick = (event: MouseEvent) => {
    if (!isInitOver) return;
    
    const el = document.getElementById("canvs-box");
    if (el == null) return;
    mouseVec.x = (event.offsetX / el.clientWidth) * 2 - 1;
    mouseVec.y = -(event.offsetY / el.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);

    // let arr = projectStore.modelList.map((item: any) => {
    //   if(item.type == 'Valve') return item.getObject3D().children[0]
    //   else return item.flanges.map((item: any) => item.flange.getObject3D())
    // }).flat();
    let arr = [...modelArr]
    console.log("arr===>", arr);
    let intersectsModel = raycaster.intersectObjects(arr, true);
    console.log("intersectsModel===>", intersectsModel);
    
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
    if(model && model.name == 'flange-model'){
      console.log(projectStore.activeClass)
      let selectFlange = projectStore.activeClass.findFlange(model.uuid)
      console.log(selectFlange)
      if(!selectFlange) return
      let port:Port = selectFlange.flange.getPort()
      console.log("port===>", port);
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
      console.log(axisLabels)
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
    console.log("intersectsModel===>", intersectsModel );
    projectStore.menuVisiable = false
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
      console.log('projectStore.activeClass===>',projectStore.activeClass)
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
    if ((transformControls as any)._listeners.objectChange) {
      transformControls.removeEventListener("objectChange", (transformControls as any)._onObjectChange);
      delete (transformControls as any)._listeners.objectChange;
    }
    if ((transformControls as any)._listeners.mouseDown) {
      transformControls.removeEventListener("mouseDown", (transformControls as any)._onMouseDown);
      delete (transformControls as any)._listeners.mouseDown;
    }
    if ((transformControls as any)._listeners.mouseUp) {
      transformControls.removeEventListener("mouseUp", (transformControls as any)._onMouseUp);
      delete (transformControls as any)._listeners.mouseUp;
    }
  }

  window.addEventListener('keydown', (e:KeyboardEvent) => { 
    if(e.key === 'w'){
      transformControls.setMode('translate');
    }else if(e.key === 'e'){
      transformControls.setMode('rotate');
    }else if(e.key === 'r'){
      transformControls.setMode('scale');
    }
  })
  const setTransformMode = (group:THREE.Object3D) => {
    removeTransformListener()

    // const box = new THREE.Box3().setFromObject(group)
    // const center = new THREE.Vector3()
    // box.getCenter(center)
    // console.log(center,transformControls)
    // transformControls._gizmo.position.copy(center)

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
    console.log("initSize===>", initSize);
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
      // pipeObj = 
      // console.log("pipeObj===>", pipeObj);
    }
    const onMouseUp = () => {
      pipeObj.baseLength = pipeObj.params.length;
    };
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
      // console.log('setTransformModeToRotate')
      // pipeObj.updatePortList()
      pipeObj.notifyPortsUpdated()
    }

    transformControls.addEventListener("objectChange", onObjectChange);
    
    // transformControls.showY = false
    // transformControls.showZ = false
    // transformControls.showX = true
    let axis = pipeObj.rotateAxis
    console.log("axis===>", axis);
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
    // if(pipeObj.type == 'TeePipe'){
    //   if(pipeObj.rotationType){
    //     transformControls.showY = true 
    //     transformControls.showX = false
    //     transformControls.showZ = false
    //   }else{
    //     transformControls.showY = false  
    //     transformControls.showX = true
    //     transformControls.showZ = false
    //   }
    // }
    // if(pipeObj.type == 'CrossPipe'){
    //   if(pipeObj.rotationType){
    //     transformControls.showY = false
    //     transformControls.showZ = false
    //     transformControls.showX = true
    //   }else{
    //     transformControls.showY = true
    //     transformControls.showZ = false
    //     transformControls.showX = false
    //   } 
    // }
    // if(pipeObj.type == 'Valve'){
    //   let axis = group.userData.rotateAxis
    //   if(axis == 'X'){
    //     transformControls.showY = false
    //     transformControls.showZ = false
    //     transformControls.showX = true
    //   }else if(axis == 'Y'){
    //     transformControls.showY = true
    //     transformControls.showZ = false
    //     transformControls.showX = false
    //   }else{
    //     transformControls.showY = false
    //     transformControls.showX = false
    //     transformControls.showZ = true
    //   }
    // }
  }

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

  const worldToScreen = (point: THREE.Vector3) => { 
    camera.updateMatrixWorld();
    const vector = point.clone();
    vector.project(camera);

    const rect = renderer.domElement.getBoundingClientRect();

    const x = (vector.x + 1) / 2 * rect.width;
    const y = (-vector.y + 1) / 2 * rect.height;

    return { x, y };
  }


  const updateAxisLabels = () => { 
    if (!axisLabels) return;
    const THRESHOLD_PX = 1;
    const p = worldToScreen(axisLabels.worldPos);
    const last = axisLabels.lastScreen;
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > THRESHOLD_PX) {
      axisLabels.lastScreen = {x:p.x,y:p.y}
      projectStore.menuPos = {x:p.x,y:p.y}
    }
  }

  onUnmounted(() => {
    window.removeEventListener("resize", onWindowResize, false);
    destroyScene();
  });

  /**
   
   * @description: 添加模型
   * @param type 模型类型 type: 0-正方形 1-圆柱体形 2-胶囊形 
   * 
  */ 
  const addChamberModel = (type:string,option:any) => {
    let box :any = {}
    let group = {} as THREE.Group
    // let offsetX: number = 0
    // let offsetY: number = 0
    // console.log("main_addChamberModel===>", type,option);
    modelArr.forEach((child: THREE.Object3D) => {
      if (child?.name == 'objchamber') {
        scene.remove(child)
        disposeObject(child);
      }
    })
    if( type == '0') {
      box = new TransparentBox(option)
    }else if (type == '1'){
      box = new CylinderWithBase(option)
    } else if (type == '2'){
      box = new CapsuleWithThickness(option)
    }
    if(!group || !box){
      console.error('group-err || box-err');
    }
    group = box.getObject3D()
    box.params.cType = type
    group.name = 'objchamber'
    let model_box =  box3.setFromObject(group)
    const minY = model_box.min.y;
    group.position.y -= minY;

    // box.setSeleteState(0x72b0e6)
    scene.add(group)
    modelArr[0] = group
    projectStore.modelList[0]=box
  }
  /**
   * @description: 添加管道
   * @param option 
  */
  const addPipeModel = () => {
    // console.log(projectStore.activeClass.activeFlange)
    let diameter = calculatePrevDiameter()
    // options.diameter = diameter
    try{
      let pipe = new HollowPipe(diameter)
      connectFnc(pipe)
    }catch(err){
      console.error("addPipeModel-err",err)
      return
    }
    
    // connectPipes(group,inOffset,)
    // return pipe
  }

  const addBendModel = (options:any) => {
    let diameter = calculatePrevDiameter()
    options.diameter = diameter
    const box = new HollowBend({
      ...options
    });
    connectFnc(box)
  }

  /**
   * @type =0的时候连接主管道，=1的时候连接分支管道
  */
  const addTeeModel = (type:string = '0') => {
    let diameter = calculatePrevDiameter()
    // options.mainDiameter = diameter
    // options.branchDiameter = diameter
    let box = new TeePipe(diameter)
    if(type == '1'){
      box.resetPortList()
    }
    connectFnc(box)
  }

  // 添加直角斜切管
  const addLTubeModel =  () =>{
    let diameter = calculatePrevDiameter()
    // options.diameter = diameter
    let box = new HollowLTube(diameter)
    connectFnc(box)
  }

  // 添加异径管
  const addReducerModel = () => {
    let diameter = calculatePrevDiameter()
    // options.innerStart = diameter
    let box = new ReducerPipe(diameter)
    connectFnc(box)
  }

  // 添加十字四通管
  const addCrossPipeModel = () => {
    let diameter = calculatePrevDiameter()
    // options.innerMain = diameter
    // options.innerBranch = diameter > 0.02 ? diameter - 0.02 : 0.02
    let box = new CrossPipe(diameter)
    // if(subType == '1'){
    //   box.resetPortList()
    // }
    connectFnc(box)
  }

  const calculatePrevDiameter = () => {
    let diameter = projectStore.activeClass.activeFlange.flange.params.actualDiameter
    diameter = Math.round(diameter * 10000) / 10000
    console.log('diameter=====>',diameter)
    return diameter
  }
  // const addStpModel = async (url:string) => {
  //   if(!url) return
  //   let model = await loadStep(url)
  //   if(!model) return
  //   scene.add(model)
  // }

  const addGLBModel = async (type:string) => {
    let diameter = calculatePrevDiameter()
    try{
      let box = new PumpModel(diameter,type)
      // scene.add(box.getObject3D())
      connectFnc(box)
    }catch(err){
      console.error("addGLBModel-err",err)
      return
    }
    // let model = await loadGLBModel(options.url)
    // if(!model) return
    // console.log(model)
    // model.position.set(options.pos.x,options.pos.y,options.pos.z)
    // model.userData.isRoot = true

    // scene.add(model)
    // modelArr.push(model)
  }

  const addValveModel = () => {
    let diameter = projectStore.activeClass.activeFlange.flange.params.actualDiameter
    console.log('diameter=====>',diameter)
    if (!diameter) return;
    let box = new ValveModel(diameter)
    scene.add(box.getObject3D())
    connectFnc(box)
  }

  const connectFnc = (initClass:any) => {
    console.log('connectFnc===>',initClass)
    try{
      if(!interactiveModel) return;
      let group = initClass.getObject3D()
      console.log(initClass.getPort('in'))
      let in_port = initClass.getPort('in')[0]
      // let out_portList: any = []
      let out_port :any= {}
      console.log('interactiveModel==>',interactiveModel)

      let arr = projectStore.modelList.reduce((arr:any[],obj:any) => {
        arr.push(...obj.flanges)
        return arr
      },[])
      // console.log('arr==>',arr)
      arr.forEach((item:any) => {
        if(item.flange.getObject3D().uuid == projectStore.activeClass.activeFlange.flange.getObject3D().uuid){
          console.log('item==>',item)
          out_port = item.flange.getPort()
        }
      })
      console.log('connectFnc===>',in_port,out_port)
      if (!out_port || !in_port) {
        console.log('outOffset===>',out_port)
        throw new Error("not find out_port or in_port");
      }
      if(out_port.connected !== null){
        throw new Error("outlet-model is already connected");
      }
      out_port.updateLocal()
      in_port.updateLocal()
      in_port.connectTo(out_port)
      scene.add(group)
      modelArr.push(group)
      console.log(projectStore.modelList)
      projectStore.addClass(initClass)
    }catch(err){
      console.error("connectFnc-err",err,initClass,interactiveModel)
      return
    }
  } 

  const delModel = (uuid:string, visited = new Set<string>()) => {
    console.log("delModel===>", uuid);
    if (!uuid || visited.has(uuid)) return;
    visited.add(uuid);
    let curClass = projectStore.modelList.find((item:any) => item.getObject3D().uuid == uuid)
    if(!curClass) return
    // scene.remove(curClass.getObject3D())
    // 先移除当前模型的transformControls
    if(transformControls)
      transformControls.detach()
    const obj = curClass.getObject3D();
    // 从父节点移除（确保无论是直接子节点还是嵌套子节点都能移除）
    if (obj.parent) {
      obj.parent.remove(obj);
    } else {
      scene.remove(obj);
    }
    modelArr = modelArr.filter((g: any) => g.uuid !== obj.uuid);
    const idx = projectStore.modelList.findIndex((item: any) => item.getObject3D().uuid === uuid);
    if (idx > -1) projectStore.modelList.splice(idx, 1);

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

    let portList:Port[] = curClass.portList
    portList.forEach((p:Port) => {
      if(p.connected && p.isConnected){
        const parentObj = p.connected.parent.getObject3D();
        if (parentObj) delModel(parentObj.uuid, visited);
      }
    })

  }
  
  const testFnc = () => {
    const box = new ReducerPipe(1);
    console.log("box===>", box);
    let group = box.getObject3D();
    // group.rotation.z = -Math.PI / 2;
    group.position.set(-2, 1, 0)
    // group.userData = { name: "test_group_2" };
    scene.add(group);
    modelArr.push(group);
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
    addValveModel
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
  // user-select: ;
}
</style>