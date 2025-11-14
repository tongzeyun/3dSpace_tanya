<template>
  <div id="mini-canvs-box"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
// import { useProjectStore } from '@/store/project';
import * as THREE from "three";
import { ENUM_Box_Faces } from '@/utils/enum'
import { TransparentBox} from '@/utils/model-fuc/TransparentBox'
import { CylinderWithBase } from '@/utils/model-fuc/CylinderWithBase'
import { CapsuleWithThickness } from '@/utils/model-fuc/CapsuleWithThickness'
import { disposeObject } from '@/utils/three-fuc'
// import { TransparentBox_1 } from '@/utils/model-fuc/ThickBox_1'
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//@ts-ignore
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
//@ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
//@ts-ignore
import { ViewHelper } from "@/assets/js/three/ViewHelper";
// import { CSS2DRenderer , CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
// import { CSS3DRenderer , CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';
  // const projectStore = useProjectStore();
  let scene: THREE.Scene | any;
  let camera: THREE.OrthographicCamera | any;
  let renderer: THREE.WebGLRenderer | any;
  let orbit: OrbitControls | any;
  // let css3dRender : CSS2DRenderer;
  // let mixerObj: any = [];
  //坐标系
  let transformControls: TransformControls | any;
  //画布盒
  let canvasBox: HTMLElement | any;
  let cvSizes: any;
  //射线
  // let raycaster: THREE.Raycaster = new THREE.Raycaster();
  // let mouseVec: THREE.Vector2 = new THREE.Vector2(0, 0);
  let requestAnimationFrameId: any;
  //场景辅助工具对象
  let sceneHelpers: THREE.Object3D = new THREE.Object3D();
  let box3Helper: THREE.Box3Helper;
  let box3: THREE.Box3;
  // let viewHelper: any;
  let gridHelper: THREE.GridHelper;
  let planeMesh: THREE.Mesh;
  // let keyValue: string = "";
  //模型
  // let modelArr: any = [];

  let isShadow: boolean = true;
  let dirLight: THREE.DirectionalLight;
  let modelThreeObj: THREE.Object3D = new THREE.Object3D();
  let isLightHelper: boolean = false;
  // let isInitOver :boolean = false;
  let axisLabels : {el:HTMLElement,worldPos:THREE.Vector3,lastScreen:{x:number,y:number}}[]= []
  let pendingLabelUpdate = false; // 控制是否更新坐标轴标签
  let curModel : any; // 当前模型
  let curModelType : string = '' // 0 - 箱体 1 - 圆柱体 2 - 胶囊体
  let axisList :THREE.Group[]= [] // 轴列表
  const emits = defineEmits(["ready","updateChamberModel"]);

  onMounted(() => {
    initApplication();
    // emits("ready")
    // testFnc()
    // testFnc_1()
  })

  const initApplication = () => {
    canvasBox = document.getElementById("mini-canvs-box");
    console.log(canvasBox)
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

    // isInitOver = true;
    emits("ready")
  }

  const initScene = () => {
    //创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);
    
    // scene.add(new THREE.AxesHelper(1));
  };
  const initCamera = () => {
    //创建相机
    camera = new THREE.PerspectiveCamera(
      45,
      cvSizes.width / cvSizes.height,
      0.1,
      10000
    );
    camera.position.set(1.8, 1.6, 1.9);
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

    // css3dRender = new CSS2DRenderer();
    // css3dRender.setSize(cvSizes.width, cvSizes.height);
    // css3dRender.domElement.style.position = "absolute";
    // css3dRender.domElement.style.top = "0px";
    // css3dRender.domElement.style.pointerEvents = "none";
    // canvasBox.appendChild(css3dRender.domElement);
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

    // scene.add(gridGroup);

    //小窗口的坐标系
    // viewHelper = new ViewHelper(camera, canvasBox);
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

    // css3dRender.render(scene, camera);
    // viewHelper.render(renderer);
    // updateAxisLabels()
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

  // const onMouseUpCanvs = (event: MouseEvent) => {
  //   if (!isInitOver) return;
  //   const el = document.getElementById("canvs-box");
  //   if (el == null) return;
  //   mouseVec.x = (event.offsetX / el.clientWidth) * 2 - 1;
  //   mouseVec.y = -(event.offsetY / el.clientHeight) * 2 + 1;
  //   raycaster.setFromCamera(mouseVec, camera);
  //   let arr = [...modelArr]
  //   console.log("arr===>", arr);
  //   let intersectsModel = raycaster.intersectObjects(arr, true);
  //   console.log("intersectsModel===>", intersectsModel);
  //   const self = intersectsModel[0]?.object;
  //   console.log("self====>", self);
  //   //不存在
  //   if (!self) return;
  // }

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

      let parent: HTMLElement | any = document.getElementById("mini-canvs-box");
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

  /**
   * @description: 添加模型
   * @param type 模型类型 type: 0-长方体 1-圆柱体 2-胶囊形 
   * 
  */ 
  const addChamberModel = ( type: string | number, options?: any) => {
    if(curModel){
      clearScene()
    }
    // console.log("type===>", type);
    curModelType = type.toString()
    try{
      if( curModelType == '0') {
        curModel = new TransparentBox({...options})
      }else if (curModelType == '1'){
        curModel = new CylinderWithBase({...options})
      } else if (curModelType == '2'){
        curModel = new CapsuleWithThickness({...options})
      }
      console.log("curModel===>", curModel);
      curModel.setPosition(0, 0, 0)
      let model = curModel.getObject3D()
      // console.log("model===>", model.group);
      scene.add(model)
      // modelArr.push(model)
      addAxisModel(curModelType, options)
      curModel.addOutletModel(5)
      // addOutletPos(4)
      
      return curModel
    }catch(err){
      console.log("addChamberModel-err", err);
    }
  }

  const updateChamberModel = (name:string,value:number) => { 
    // console.log("updateChamberModel===>", name, value);
    curModel = curModel.resize({
      [name]: Number(value)
    })
    console.log("curModel===>", curModel);
    let arr = calcPosForAxis(curModelType, curModel)
    console.log("arr===>", arr);
    // 更新长度轴和标签位置
    arr.forEach((item:any,index:number) => {
      // console.log("item===>", item);
      axisList[index].position.set(item.origin.x, item.origin.y, item.origin.z)
      axisList[index].userData.updateLength(item.num)
      axisLabels[index].worldPos.copy(item.labelPos)
    })
    // console.log(axisList,axisLabels)
    updateAxisLabels()
    emits("updateChamberModel",{name,value})
  }

  const calcPosForAxis = ( type: string|number, options: any ) => {
    let arr = []
    let offset = 0.1;
    if(type == '0'){
      const {width,length,height} = options
      const W_origin = new THREE.Vector3(-width/2 , height/2 + offset , -length/2 - offset);
      const W_label = new THREE.Vector3(0 , height/2 + 2*offset , -length/2 - 2*offset);
      const L_origin = new THREE.Vector3(-width/2 - offset, height/2 + offset, -length/2);
      const L_label = new THREE.Vector3(-width/2 - 2*offset , height/2 + 2*offset , 0);
      const H_origin = new THREE.Vector3(-width/2 - offset , - height/2 , length/2 + offset);
      const H_label = new THREE.Vector3(-width/2 - 2*offset , 0 ,  length/2 + 2*offset);
      arr.push(
        {
          name:'width',
          label: 'W',
          origin:W_origin,
          labelPos: W_label,
          num: width,
          color: 0xff0000,
          dir:new THREE.Vector3(1,0,0),
        },
        {
          name:'length',
          label: 'L',
          origin:L_origin,
          labelPos:L_label,
          num: length,
          color: 0x1072ca,
          dir:new THREE.Vector3(0,0,1),
        },
        {
          name:'height',
          label: 'H',
          origin:H_origin,
          labelPos:H_label,
          num: height,
          color: 0x01c01c,
          dir:new THREE.Vector3(0,1,0),
        }
      )
    }else if (type == '1'){
      const {radius,height} = options
      const R_origin = new THREE.Vector3(-radius/2, height / 2 + offset, 0);
      const R_label = new THREE.Vector3(0, height / 2 + 2*offset ,0);
      const H_origin = new THREE.Vector3(0 , -height / 2 ,radius/2 + offset);
      const H_label = new THREE.Vector3(0,0,radius/ 2 + 2*offset);
      arr.push(
        {
          name:'radius',
          label: 'R',
          origin:R_origin,
          labelPos:R_label,
          num: radius,
          color: 0xff0000,
          dir:new THREE.Vector3(1,0,0),
        },
        {
          name:'height',
          label: 'H',
          origin:H_origin,
          labelPos:H_label,
          num: height,
          color: 0x01c01c,
          dir:new THREE.Vector3(0,1,0),
        }
      )
    }else if (type == '2'){
      const {radius,height} = options
      const R_origin = new THREE.Vector3(-radius/2, height/2 + offset + radius/6, 0);
      const R_label = new THREE.Vector3(0, height/2 + 2*offset + radius/6,0);
      const H_origin = new THREE.Vector3(0 , -height / 2 ,radius/2 + offset);
      const H_label = new THREE.Vector3(0,0,radius/ 2 + 2*offset);
      arr.push(
        {
          name:'radius',
          label: 'R',
          origin:R_origin,
          labelPos:R_label,
          num: radius,
          color: 0xff0000,
          dir:new THREE.Vector3(1,0,0),
        },
        {
          name:'height',
          label: 'H',
          origin:H_origin,
          labelPos:H_label,
          num: height,
          color: 0x01c01c,
          dir:new THREE.Vector3(0,1,0),
        }
      )
    }
    return arr
  }
  
  const addAxisModel = ( type: string|number, options:any ) => { 
    removeAxisLabels();
    // let offset = 0.1;
    let arr = calcPosForAxis( type, options )
    arr.forEach(item => { 
      let axios = createDimensionLine(item.origin, item.num , item.dir , item.color)
      axisList.push(axios)
      scene.add(axios)
      createSprite( item.name , item.label , item.num , item.labelPos)
    })
  }

  const createDimensionLine = (
    pos : THREE.Vector3,
    length: number,
    direction: THREE.Vector3,
    color: number = 0xff0000
  ): THREE.Group => {
    const group = new THREE.Group();
    // group.add(new THREE.AxesHelper(0.5))
    const lineGeom = new THREE.CylinderGeometry(0.005, 0.005, length - 0.4, 8);
    const lineMat = new THREE.MeshBasicMaterial({ color });
    const line = new THREE.Mesh(lineGeom, lineMat);
    line.position.y = length / 2;
    group.add(line);

    const coneGeom = new THREE.ConeGeometry(0.02, 0.2, 12);
    const coneMat = new THREE.MeshBasicMaterial({ color });

    // 起点圆锥
    const coneStart = new THREE.Mesh(coneGeom, coneMat);
    coneStart.rotation.x = Math.PI;
    coneStart.position.y = 0.1;
    group.add(coneStart);

    // 终点圆锥
    const coneEnd = new THREE.Mesh(coneGeom, coneMat);
    coneEnd.position.y = length - 0.1;
    group.add(coneEnd);

    // 根据方向旋转
    const axis = new THREE.Vector3(0, 1, 0); // cylinder 默认沿 Y 轴
    group.quaternion.setFromUnitVectors(axis, direction.clone().normalize());

    group.position.copy(pos);
    group.userData._dim = { line, coneStart, coneEnd };
    group.userData.updateLength = (newLength: number) => {
      newLength = Math.max(0.01, newLength);
      // 更新线段几何（dispose 旧的）
      (group.userData._dim.line.geometry as THREE.BufferGeometry).dispose();
      group.userData._dim.line.geometry = new THREE.CylinderGeometry(0.005, 0.005, Math.max(0.01, newLength - 0.4), 8);
      // 重新定位线与终点箭头
      group.userData._dim.line.position.y = newLength / 2;
      group.userData._dim.coneEnd.position.y = newLength - 0.1;
    };
    return group;
  }
  
  // 将3D场景中的坐标转换成屏幕坐标
  const worldToScreen = (point: THREE.Vector3) => { 
    // console.log("point===>", point);
    const vector = point.clone();
    vector.project(camera);
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;
    return {
      x: (vector.x + 1) / 2 * width,
      y: (-vector.y + 1) / 2 * height
    };
  }

  const createSprite = ( name:string , txt: string , num: number , pos: THREE.Vector3 ) => { 
    const labelElement = document.createElement("div");
    let styleObj :any= {
      color:'black',
      position: "absolute",
      top: "0px",
      left: "0px",
      width: "100px",
      height: "fit-content",
      fontSize: "14px",
      background: "transparent",
      borderRadius:'3px',
      pointerEvents:'auto',
      transform: "translate(-50% , -50%)",
      zIndex:999,
      padding: "2px 4px",
      boxSize: 'border-box'
    }
    Object.keys(styleObj).forEach((key:any) => {
      labelElement.style[key] = styleObj[key];
    });
    labelElement.className = name;
    labelElement.innerText = `${txt}`;
    const input = document.createElement("input");
    input.type = "text";
    input.style.border = "1px solid #aaaaaa";
    input.style.borderRadius = '3px'
    input.style.outline = "none";
    input.style.width = "30px";
    input.style.height = "20px";
    input.style.textAlign = "right";
    input.style.backgroundColor = "transparent";
    input.style.padding = "0 10px";
    input.style.marginLeft = "5px";
    input.value = `${num}`;
    input.addEventListener("change",(event: Event) => {
      // console.log(event)
      // console.log()
      const value = (event.target as HTMLInputElement).value;
      // console.log("value===>", value);
      let className = (event.target as HTMLInputElement).parentElement?.className ?? ''
      // console.log("className===>", className);
      if(!className.length) {
        console.error(new Error('className is empty'))
        return
      }
      if(isNaN(parseFloat(value))) {
        (event.target as HTMLInputElement).value = curModel[name]
        console.error(new Error('value is not a number'))
        return
      }
      updateChamberModel(className,Number(value))
    })
    labelElement.appendChild(input);
    canvasBox.appendChild(labelElement);

    const p = worldToScreen(pos);
    // labelElement.style.left = `${p.x}px`
    // labelElement.style.top = `${p.y}px`
    labelElement.style.transform = `translate3d(${p.x}px,${p.y}px,0) translate(-50% , -50%)`,
    axisLabels.push({ el: labelElement, worldPos: pos.clone() , lastScreen:{x:p.x,y:p.y}})
  }

  const updateAxisLabels = () => { 
    if (!axisLabels.length) return;
    const THRESHOLD_PX = 1; 
    axisLabels.forEach(item => {
      const p = worldToScreen(item.worldPos);
      const last = item.lastScreen;
      
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > THRESHOLD_PX) {
        // console.log("p===>", p);
        item.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50% , -50%)`;
        item.lastScreen = {x:p.x,y:p.y}
      }
    });
  }

  const clearScene = () => {
    scene.remove(curModel.getObject3D())
    disposeObject(curModel.getObject3D());
    axisList.forEach(item => {
      scene.remove(item)
      disposeObject(item)
    })
    axisList = []
    removeAxisLabels()
  }

  const removeAxisLabels = () => { 
    if(!axisLabels.length) return;
    axisLabels.forEach(item => {
      if (item.el && item.el.parentNode) item.el.parentNode.removeChild(item.el);
    });
    axisLabels = [];
  }

  const addOutletModel = (faceIndex: number, options?: { radius?: number; length?: number; color?: number }) => {
    curModel.addOutletModel(faceIndex, options)
    // const mainModel = curModel.getObject3D()
    // mainModel.traverse((child: THREE.Mesh) => { 
    //   if (child.name === 'outlet-model') {
    //     // console.log("child===>", child);
    //     child.parent!.remove(child)
    //     disposeObject(child)
    //   }
    // });
    // let faceName = ENUM_Box_Faces[faceIndex]
    // console.log("faceName===>", faceName);
    // console.log(curModel.faces[faceName])
    // const faceMesh: THREE.Mesh | undefined = curModel?.faces?.[faceName]
    // if (!faceMesh) {
    //   console.warn("face not found", faceName)
    //   return
    // }
    // // const worldPos = new THREE.Vector3()
    // // faceMesh.getWorldPosition(worldPos)
    // // const faceWorldQuat = new THREE.Quaternion()
    // // faceMesh.getWorldQuaternion(faceWorldQuat)
    // // const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(faceWorldQuat).normalize()

    // // const cylRadius = 0.1
    // // const cylLength =(curModel && curModel.thickness) ? Number(curModel.thickness) - 0.001 : 0.05- 0.001
    // // const cylGeom = new THREE.CylinderGeometry(cylRadius, cylRadius, cylLength, 24)
    // // const cylMat = new THREE.MeshStandardMaterial({ color: 0xa395a3,side: THREE.FrontSide,})
    // // const cylinder = new THREE.Mesh(cylGeom, cylMat)
    // // const worldQuatForCylinder = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1,0), normal)
    // // const placeWorldPos = worldPos.clone()

    // // // 计算加入 faceMesh 作为子对象时的本地位置与本地旋转
    // // const parentWorldQuat = new THREE.Quaternion()
    // // faceMesh.getWorldQuaternion(parentWorldQuat)
    // // const parentWorldQuatInv = parentWorldQuat.clone().invert()
    // // const localQuat = parentWorldQuatInv.clone().multiply(worldQuatForCylinder)
    // // const localPos = faceMesh.worldToLocal(placeWorldPos.clone())

    // // cylinder.add(new THREE.AxesHelper(0.3))
    // // // 添加到 faceMesh，保持随模型移动/旋转
    // // cylinder.position.copy(localPos)
    // // cylinder.quaternion.copy(localQuat)

    // const radius = options?.radius ?? 0.1
    // const cylLength = options?.length ?? (curModel.thickness -0.01)
    // const color = options?.color ?? 0xa395a3
    // const cylGeom = new THREE.CylinderGeometry(radius, radius, cylLength, 32)
    // const cylMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    // const cylinder = new THREE.Mesh(cylGeom, cylMat)
    // cylinder.name = 'outlet-model'
    // console.log(cylinder)
    // cylinder.add(new THREE.AxesHelper(0.3))
    // switch (faceName) {
    //   case 'front':
    //   case 'back':
    //     cylinder.rotation.x = Math.PI / 2
    //     break
    //   case 'left':
    //   case 'right':
    //     cylinder.rotation.z = Math.PI / 2
    //     break
    // }
    // console.log(cylinder)
    // if(curModelType != '0' && faceName =='left'){
    //   cylinder.position.set(curModel.radius/2 - curModel.thickness,0,0)
    // }
    // if(curModelType == '2'){
    //   if(faceName =='top'){
    //     cylinder.position.set(0,curModel.radius * 0.2 - curModel.thickness/2,0);
    //   }else if(faceName =='bottom'){
    //     cylinder.position.set(0,-curModel.radius * 0.2 + curModel.thickness/2,0);
    //   }
      

    // }
    // faceMesh.add(cylinder)
    // console.log('cylinder getWorldPosition',cylinder.getWorldPosition(new THREE.Vector3()))
  }

  const setOutletOffset = (offsetX: number, offsetY: number) => {
    console.log("setOutletOffset===>", offsetX, offsetY);
    curModel.setOutletOffset(offsetX, offsetY)
  }

  const setSeleteState = (color: number) => {
    curModel.setSeleteState(color)
  }

  // const disposeObject = (obj: THREE.Object3D) => {
  //   obj.traverse((child: any) => {
  //     // 释放几何体
  //     if (child.geometry) {
  //       child.geometry.dispose();
  //     }

  //     // 释放材质（可能是数组）
  //     if (child.material) {
  //       if (Array.isArray(child.material)) {
  //         child.material.forEach((m: THREE.Material) => disposeMaterial(m));
  //       } else {
  //         disposeMaterial(child.material);
  //       }
  //     }
  //   });
  // }
  // function disposeMaterial(material: THREE.Material) {
  //   // 释放材质中的贴图纹理
  //   for (const key in material) {
  //     const value = material[key as keyof THREE.Material];
  //     if (value instanceof THREE.Texture) {
  //       value.dispose(); // Texture dispose
  //     }
  //   }
  //   material.dispose(); // Material dispose
  // }

  // const testFnc = () => {
  //   const box = new TransparentBox({
  //     width: 2,
  //     height: 1.2,
  //     depth: 1,
  //     thickness: 0.05,
  //     faceConfigs: {
  //       front: { color: 0xd6d5e3, opacity: 0.5 },
  //       back: { color: 0xd6d5e3, opacity: 0.5 },
  //       left: { color: 0xd6d5e3, opacity: 0.5 },
  //       right: { color: 0xd6d5e3, opacity: 0.5 },
  //       top: { color: 0xd6d5e3, opacity: 0.5 },
  //       bottom: { color: 0xd6d5e3, opacity: 0.5 },
  //     },
  //   })
  //   box.setPosition(0, 0, 0)
  //   box.setFaceProperty("top",{color:0x72b0e6})
  //   let group = box.getObject3D()
  //   // group.userData.name = "test_group_1" 
  //   scene.add(group)
  //   // modelArr.push(group)

  //   // const box1 = new CylinderWithBase({
  //   //   radius: 1,
  //   //   height: 1,
  //   //   thickness: 0.05,
  //   //   color: 0xd6d5e3,
  //   //   opacity: 0.5,
  //   //   baseColor: 0xd6d5e3,
  //   // });
  //   // box1.setPosition(-2, 0.5, 2);
  //   // let group1 = box1.getObject3D();
  //   // group1.userData = { name: "test_group_cy_1" };
  //   // scene.add(group1);
  //   // modelArr.push(group1);
  //   // box1.setBottomBaseColor(0x72b0e6)

  //   // const box2 = new CapsuleWithThickness({
  //   //   radius: 1.5,
  //   //   height: 2,
  //   //   thickness : 0.05,
  //   //   color : 0xd6d5e3,
  //   //   opacity : 0.5,
  //   // })
  //   // box2.setPosition(-2, 0.5, -4);
  //   // let group2 = box2.getObject3D();
  //   // group2.userData = { name: "test_group_Cap_1" };
  //   // scene.add(group2);
  //   // modelArr.push(group2);
  //   // box2.setTopColor(0x72b0e6)
  // }

  // const testFnc_1 = () => {
  //   const box = new TransparentBox_1({
  //     width: 4,
  //     height: 2,
  //     depth: 1,
  //     thickness: 0.05,
  //     outerColor: 0x66ff66,
  //     innerColor: 0x66ff66,
  //     topColor: 0xff6666,
  //     opacity: 0.6,
  //   });
  //   box.setPosition(-3,1,0)
  //   let group = box.getObject3d();
  //   group.userData = { name: "test_group_2" };
  //   // scene.add(group);
  //   // modelArr.push(group);
  // }


  defineExpose({
    addChamberModel,
    setOutletOffset,
    addOutletModel,
    setSeleteState
    // changeOutletPos
    // disposeChamberModel,
  })
</script>

<style scoped lang="scss">
#mini-canvs-box {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  // opacity: 0.1;
}
</style>