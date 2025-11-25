<template>
  <div id="canvs-box" @mouseup.stop="onMouseUpCanvs"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useProjectStore } from '@/store/project';
import * as THREE from "three";
import { TransparentBox} from '@/utils/model-fuc/TransparentBox'
import { CylinderWithBase } from '@/utils/model-fuc/CylinderWithBase'
import { CapsuleWithThickness } from '@/utils/model-fuc/CapsuleWithThickness'
import { HollowPipe } from '@/utils/model-fuc/HollowPipe'
import { HollowBend } from '@/utils/model-fuc/HollowBend'
// import { TransparentBox_1 } from '@/utils/model-fuc/ThickBox_1'
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//@ts-ignore
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
//@ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
//@ts-ignore
import { ViewHelper } from "@/assets/js/three/ViewHelper";
import { connectPipes } from "@/utils/three-fuc";

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
  let axisLabels: {el:HTMLElement,worldPos:THREE.Vector3,lastScreen:{x:number,y:number}}[]= []
  let pendingLabelUpdate: boolean = false
  let interactiveModel = new THREE.Object3D() as THREE.Object3D | null;
  onMounted(() => {
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

  const onMouseUpCanvs = (event: MouseEvent) => {
    if (!isInitOver) return;
    const el = document.getElementById("canvs-box");
    if (el == null) return;
    mouseVec.x = (event.offsetX / el.clientWidth) * 2 - 1;
    mouseVec.y = -(event.offsetY / el.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);
    let arr = [...modelArr]
    projectStore.modelList[0].flanges.forEach((item: any) => {
      arr.push(item.getObject3D())
    })
    console.log("arr===>", arr);
    let intersectsModel = raycaster.intersectObjects(arr, true);
    console.log("intersectsModel===>", intersectsModel);
    if (intersectsModel.length == 0) {
      transformControls.detach();
      return;
    }
    // 判断是否点击交互对象
    const model = intersectsModel.find((ele:any) => 
      ele.object.userData.canInteractive || 
      findRootGroup(ele.object)?.userData.canInteractive
    )
    console.log("model===>", model);
    if(model){
      interactiveModel = model!.object.name == 'outlet-model' ? model.object : findRootGroup(model.object) 
      clearSprite()
      createSprite(model.object)
    }
    // 获取点击模型的顶级group
    const self = intersectsModel[0]?.object;
    console.log("self====>", self);
    //不存在
    if (!self) return;
    if(self?.type == 'Mesh'){
      const parentGroup = findRootGroup(self);
      console.log("parentGroup===>", parentGroup);
      if(!parentGroup) return
      projectStore.findCurGroup(parentGroup!.uuid)
      if(parentGroup?.userData.isTransform){
        // transformControls.attach(parentGroup);
        setTransformModeToScale(parentGroup)
      }else{
        transformControls.detach()

      }
    }else{
      // console.log("self===>", self);
      transformControls.detach()
    }
  }

  const setTransformModeToScale = (group:THREE.Object3D) => {
    let curMode = transformControls.getMode()
    if(curMode != 'scale') transformControls.setMode('scale')
    transformControls.attach(group);
    let pipeObj: any = null;
    const onObjectChange = () => {
      if(!pipeObj) return
      const s = transformControls.object.scale.y;
      console.log("s===>", s);
      if (s == 1) return;
      pipeObj.setLength(s);
      pipeObj.length = pipeObj.params.length;
    }
    const onMouseDown = () => {
      pipeObj = projectStore.modelList.find(
        (item: any) => item.getObject3D().uuid === transformControls.object.uuid
      );
      console.log("pipeObj===>", pipeObj);
    }
    const onMouseUp = () => {
      pipeObj.baseLength = pipeObj.params.length;
      transformControls.detach()
      transformControls.removeEventListener("objectChange", () => {})
      transformControls.removeEventListener("mouseDown",() => {})
      transformControls.removeEventListener("mouseUp",() => {})
    };

    //绑定对象的数据变更时触发
    transformControls.addEventListener("objectChange", onObjectChange);
    
    transformControls.addEventListener("mouseDown", onMouseDown);

    transformControls.addEventListener("mouseUp", onMouseUp);    
    transformControls.showX = false
    transformControls.showZ = false
    // transformControls.setSpace('world')
    transformControls.minY = 0;
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

  // 将3D场景中的坐标转换成屏幕坐标
  const worldToScreen = (point: THREE.Vector3) => { 
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix && camera.updateProjectionMatrix();

    const vector = point.clone();
    vector.project(camera);

    const rect = renderer.domElement.getBoundingClientRect();

    const x = (vector.x + 1) / 2 * rect.width;
    const y = (-vector.y + 1) / 2 * rect.height;

    return { x, y };
  }

  const createSprite = (model:THREE.Object3D) => {
    let pos = new THREE.Vector3(0,0,0)
    model.getWorldPosition(pos)
    pos.add(new THREE.Vector3(0.2,0.4,0))
    console.log("pos===>", pos);
    const labelElement = document.createElement("div");
    let styleObj :any= {
      color:'red',
      position: "absolute",
      top: "0px",
      left: "0px",
      width: "40px",
      height: "40px",
      fontSize: "30px",
      background: "black",
      borderRadius:'50%',
      pointerEvents:'auto',
      transform: "translate(-50% , -50%)",
      zIndex:999,
      padding: "0",
      boxSize: 'border-box',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      cursor:'pointer',
      userSelect:'none'
    }
    Object.keys(styleObj).forEach((key:any) => {
      labelElement.style[key] = styleObj[key];
    });
    labelElement.className = 'label-element';
    labelElement.innerText = '+';
    canvasBox.appendChild(labelElement);
    const p = worldToScreen(pos);
    console.log("p===>", p);
    labelElement.style.transform = `translate3d(${p.x}px,${p.y}px,0) translate(-50% , -50%)`;
    axisLabels.push({el:labelElement, worldPos:pos.clone(),lastScreen:{x:p.x,y:p.y}})
    labelElement.addEventListener("click",() => {
      console.log('click change btn==>',p,pos)
      // emits('showMenu',{model})
      projectStore.menuPos = {x:axisLabels[0].lastScreen.x,y:axisLabels[0].lastScreen.y}
      projectStore.menuVisiable = !projectStore.menuVisiable
    })
    labelElement.addEventListener("mouseup", (e) => {
      e.stopPropagation();
    });
  }

  const clearSprite = () => {
    axisLabels.forEach(item => {
      item.el.remove()
    })
    axisLabels = []
    projectStore.menuVisiable = false
  }

  const updateAxisLabels = () => { 
    if (!axisLabels.length) return;
    const THRESHOLD_PX = 1; 
    axisLabels.forEach(item => {
      const p = worldToScreen(item.worldPos);
      const last = item.lastScreen;
      
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > THRESHOLD_PX) {
        // console.log("p===>", p,item.worldPos);
        item.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50% , -50%)`;
        item.lastScreen = {x:p.x,y:p.y}
        projectStore.menuPos = {x:p.x,y:p.y}
        // console.log(projectStore.menuPos)
      }
    });
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
    let offsetX :number =0
    let offsetY :number = 0
    // console.log("main_addChamberModel===>", type,option);
    modelArr.forEach((child: THREE.Object3D) => {
      if (child?.name == 'objchamber') {
        scene.remove(child)
      }
    })
    if( type == '0') {
      box = new TransparentBox(option)
      offsetX = option.hole_location_x
      offsetY = option.hole_location_y
    }else if (type == '1'){
      box = new CylinderWithBase(option)
      offsetX = option.hole_location_r
      offsetY = option.hole_location_h
    } else if (type == '2'){
      box = new CapsuleWithThickness(option)
      offsetX = option.hole_location_r
      offsetY = option.hole_location_h
    }
    if(!group || !box){
      console.error('group-err || box-err');
    }
    group = box.getObject3D()
    group.name = 'objchamber'
    let model_box =  box3.setFromObject(group)
    const minY = model_box.min.y;
    group.position.y -= minY;

    box.setSeleteState(0x72b0e6)
    scene.add(group)
    modelArr.push(group)
    box.addOutletModel(option.faceIndex)
    box.setOutletOffset(offsetX,offsetY)
    projectStore.modelList.push(box)
    // console.log(projectStore.modelList)
    // return box
  }
  /**
   * @description: 添加管道
   * @param option 
  */
  const addPipeModel = (option:any) => {
    try{
      let pipe = new HollowPipe(option)
      connectFnc(pipe)
    }catch(err){
      console.error("addPipeModel-err",err)
      return
    }
    
    // connectPipes(group,inOffset,)
    // return pipe
  }

  const addBendModel = (options:any) => {
    const box = new HollowBend({
      ...options
    });
    connectFnc(box)
    // let group = box.getObject3D();
    // group.position.set(0,1.5,0)
    // scene.add(group);
    // modelArr.push(group);
    // projectStore.modelList.push(box)
    // console.log(projectStore.modelList)
  }

  const connectFnc = (initClass:any) => {
    try{
      let group = initClass.getObject3D()
      
      let inOffset = initClass.computedInOffset()
      // let outOffset = pipe.computedOutOffset()
      console.log('inOffset====>',inOffset)
      let outOffset: any = null
      if(interactiveModel){
        // 添加管道时候，当前选中的模型是 outlet-model时候，去箱体获取 outlet-model的outOffset
        if(interactiveModel.name == 'outlet-model'){
          const targetFlange = projectStore.modelList[0].flanges.find((item:any) => item.getObject3D().uuid == interactiveModel!.uuid)
          if(targetFlange){
            outOffset = targetFlange.computedOutOffset(interactiveModel)
          }
        }else{ // 添加管道时候，当选中模型不是outlet-model时候，直接读取初始化类中的computedOutOffset函数
          console.log(projectStore.modelList,interactiveModel)
          let c = projectStore.modelList.find((ele:any) => ele.getObject3D().uuid == interactiveModel!.uuid)
          if(c){
            outOffset = c.computedOutOffset()
          }
        }
        if (!outOffset || Object.keys(outOffset).length === 0) {
          console.log('outOffset===>',outOffset)
          throw new Error("no outOffset");
        }
        scene.add(group)
        modelArr.push(group)
        connectPipes(group,inOffset,interactiveModel,outOffset)
        projectStore.modelList.push(initClass)
      }
    }catch(err){
      console.error("connectFnc-err",err,initClass,interactiveModel)
      return
    }
  }

  const findRootGroup = (obj: THREE.Object3D) : THREE.Object3D | null => {
    while (obj) {
      if (obj.userData.isRoot) return obj;
      obj = obj.parent!;
    }
    return null;
  }
  
  const testFnc = () => {
    const box = new HollowBend({
      bendAngleDeg: 45,
    });
    console.log("box===>", box);
    let group = box.getObject3D();
    group.rotation.z = -Math.PI / 2;
    group.position.set(1.5, 1, 0)
    // group.userData = { name: "test_group_2" };
    scene.add(group);
    modelArr.push(group);

    // setTimeout(() => {
    //   box.setLength(2)
    // },3000)
  }

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
    addPipeModel,
    addBendModel,
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