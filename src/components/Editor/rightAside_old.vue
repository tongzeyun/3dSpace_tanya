<script lang="ts" setup>
import { ref , reactive , onMounted ,toRaw} from 'vue'
import Layer from '../Layout/markLayer.vue';
import imgUrl from '@/assets/imagePath';
import { cloneDeep } from 'lodash'
// import { Chamber } from '@/interface/project';
import MiniCanvas from './miniCanvas.vue';
import { useProjectStore } from '@/store/project';
  const emits = defineEmits(['updateChamber'])
  const activeName = ref<string | number> ('0')
  
  const chamberVisiable = ref<boolean> (false)
  const cvsDom = ref<InstanceType<typeof MiniCanvas> | null>(null)
  const miniReady = ref<boolean>(false)
  const projectStore = useProjectStore()
  const cTypeActive = ref<string | number> (projectStore.modelList[0].cType.toString() || "0")
  // let chamberModel :any = {}
  const boxFaceOptions = ref<Record<string, string>[]>([
    { label: '上' ,value: '5' },
    { label: '下' ,value: '4' },
    { label: '左' ,value: '0' },
    { label: '右' ,value: '2' },
    { label: '前' ,value: '3' },
    { label: '后' ,value: '1' },
  ])
  const cylFaceOptions = ref<Record<string, string>[]>([
    { label: '上' ,value: '5' },
    { label: '下' ,value: '4' },
    { label: '侧' ,value: '0' },
  ])
  
  const baseOption = {
    type: 'Chamber',
    name: 'chamber',
    cType: '0',
    width: 1,
    height: 1,
    length: 1,
    radius: 1,
    thickness: 0.05,
    rotation: {x: 0, y: 0, z: 0},
    scale: {x: 1, y: 1, z: 1},
    position: {x: 0, y: 0, z: 0},
    hole_location_x: 0.5, 
    hole_location_y: 0.5, 
    hole_location_h: 0.5, 
    hole_location_r: 0,
    faceIndex: '5',
  } 
  let chamberForm = reactive<any>({})
  onMounted(() => {
  })
  const handleTypeChange = (val: string | number) => {
    chamberForm = reactive(cloneDeep(baseOption))
    initChamberModel(val)
    resetInput()
  }

  const onMiniCanvasReady = () => {
    miniReady.value = true
    console.log('MiniCanvas Ready')
    if (chamberVisiable.value) {
      initChamberModel(chamberForm.cType)
    }
  }

  const initChamberModel = (index:number | string) => {
    console.log(chamberForm)
    index = Number(index)
    // let Obj = {}  as any
    chamberForm.cType = index
    // console.log(Obj)
    // chamberModel = cvsDom.value?.addChamberModel(chamberForm.cType,{
    //   ...Obj
    // }) 
    cvsDom.value?.addChamberModel(chamberForm.cType,{
      ...chamberForm
    }) 
    // console.log(chamberModel)

    cvsDom.value?.setSeleteState(0x72b0e6)
    // cvsDom.value?.addOutletModel(chamberForm.faceIndex)
    changeOutletPos()
  }

  const showChamberPop = () => {
    // projectStore.modelList[0]
    chamberForm = reactive(cloneDeep(toRaw(projectStore.modelList[0])))
    console.log(chamberForm)
    chamberVisiable.value = true
  }

  const handleFaceChange = () => {
    console.log(chamberForm.faceIndex)
    // cvsDom.value?.addOutletModel(chamberForm.faceIndex)
    resetInput()
  }

  const handleUpdateModel = (obj:any,) => {
    console.log('handleUpdateModel===>',obj)
    chamberForm[obj.name] = obj.value
    console.log(chamberForm)
    resetInput()
    changeOutletPos()
  }

  const resetInput = () => { 
    if(chamberForm.faceIndex == 0 || chamberForm.faceIndex == 2) {
      chamberForm.hole_location_x = chamberForm.length / 2 || 0
      chamberForm.hole_location_y = chamberForm.height / 2 || 0
      chamberForm.hole_location_h = chamberForm.height / 2 || 0
    }else if(chamberForm.faceIndex == 1 || chamberForm.faceIndex == 3){
      chamberForm.hole_location_x = chamberForm.width / 2 || 0
      chamberForm.hole_location_y = chamberForm.height / 2 || 0
    }else if(chamberForm.faceIndex == 4 || chamberForm.faceIndex == 5){
      chamberForm.hole_location_x = chamberForm.width / 2 || 0
      chamberForm.hole_location_y = chamberForm.length / 2 || 0
      chamberForm.hole_location_r = 0
    }
  }
  const changeOutletPos = () => {
    if(chamberForm.cType == 0){
      cvsDom.value?.setOutletOffset(
        Number(chamberForm.hole_location_x),
        Number(chamberForm.hole_location_y)
      )
    }else{
      cvsDom.value?.setOutletOffset(
        Number(chamberForm.hole_location_r),
        Number(chamberForm.hole_location_h)
      )
    }
  }
  const cancalChamberPop = () => {
    chamberVisiable.value = false
    chamberForm = {}
  }
  const submitChamber = () => {
    // console.log(chamberForm)
    
    projectStore.modelList[0] = Object.assign(projectStore.modelList[0],chamberForm)
    console.log(projectStore.modelList)
    cancalChamberPop()
    emits('updateChamber')
  }
</script>
<template>
  <div class="r_aside_container base-box">
    <el-tabs v-model="activeName" class="demo-tabs">
      <el-tab-pane label="仓体" name="0">
        <div class="f20">仓体</div>
        <el-button v-if="projectStore.activeGroup && projectStore.activeGroup.type == 'Chamber'" @click="showChamberPop">
          修改真空室属性
        </el-button>
        <template v-if="projectStore.activeGroup && projectStore.activeGroup.type == 'Pipe'">
          <div class="length">
            长度 <el-input ></el-input>
          </div>
        </template>
      </el-tab-pane>
      <el-tab-pane label="模拟" name="1">模拟</el-tab-pane>
      <el-tab-pane label="设置" name="2">设置</el-tab-pane>
    </el-tabs>

    <Layer v-model="chamberVisiable" :width="'10.24rem'">
      <slot>
        <div class="chamber_form base-box" v-if="chamberVisiable">
          <div class="header flex-sb base-box">
            <div class="tit f16 fB">真空室配置</div>
            <img :src="imgUrl.close" @click="cancalChamberPop"></img>
          </div>
          <div class="chamber_cont flex-sb base-box">
            <div class="cnv_box base-box">
              <MiniCanvas ref="cvsDom" @ready="onMiniCanvasReady" @updateChamberModel="handleUpdateModel"></MiniCanvas>
            </div>
            <div class="chamber_info base-box">
              <el-tabs v-model="cTypeActive" @tab-change="handleTypeChange">
                <el-tab-pane label="长方体" name="0" >
                  <div class="f16 fB">真空室孔</div>
                  <!-- <div class="f16 fB">位置</div> -->
                  <el-select v-model="chamberForm.faceIndex" placeholder="Select" @change="handleFaceChange">
                    <el-option
                      v-for="item in boxFaceOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="input_box flex-sb ">
                    <div class="label f18" >X-offset</div>
                    <el-input 
                      v-model="chamberForm.hole_location_x" 
                      placeholder="请输入"
                      @change="changeOutletPos"/>
                  </div>
                  <div class="input_box flex-sb f18">
                    <div class="label f18">Y-offset</div>
                    <el-input
                      v-model="chamberForm.hole_location_y" 
                      placeholder="请输入" 
                      @change="changeOutletPos"/>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="圆柱体" name="1">
                  <div class="f16 fB">真空室孔</div>
                  <!-- <div class="f16 fB">位置</div> -->
                  <el-select v-model="chamberForm.faceIndex" placeholder="Select" @change="handleFaceChange">
                    <el-option
                      v-for="item in cylFaceOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="input_box flex-sb" v-if="chamberForm.faceIndex == '4' || chamberForm.faceIndex == '5'">
                    <div class="label f18" >R-offset</div>
                    <el-input 
                      v-model="chamberForm.hole_location_r" 
                      placeholder="请输入"
                      @change="changeOutletPos"/>
                  </div>
                  <div class="input_box flex-sb f18" v-else>
                    <div class="label f18">H-offset</div>
                    <el-input
                      v-model="chamberForm.hole_location_h" 
                      placeholder="请输入" 
                      @change="changeOutletPos"/>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="胶囊" name="2">
                  <div class="f16 fB">真空室孔</div>
                  <!-- <div class="f16 fB">位置</div> -->
                  <el-select v-model="chamberForm.faceIndex" placeholder="Select" @change="handleFaceChange">
                    <el-option
                      v-for="item in cylFaceOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div class="input_box flex-sb f18" v-if="chamberForm.faceIndex == '0'">
                    <div class="label f18">H-offset</div>
                    <el-input
                      v-model="chamberForm.hole_location_h" 
                      placeholder="请输入" 
                      @change="changeOutletPos"/>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
          <div class="chamber_btn base-box">
            <el-button @click="cancalChamberPop">取消</el-button>
            <el-button type="primary" @click="submitChamber">保存</el-button>
          </div>
        </div>
      </slot>
    </Layer>
  </div>
</template>
<style lang="scss" scoped>
.r_aside_container{
  padding: 0 0.1rem;
}
.chamber_form{
  width: 100%;
  height: 100%;
  background-color: white;
  .header{
    height: 0.55rem;
    padding: 0 0.2rem;
    border-bottom: 1px solid #E5E5E5;
    img{
      width: 0.2rem;
      height: 0.2rem;
    }
  }
}
.chamber_cont{
  .cnv_box{
    width: calc(100% - 4rem);
    height: 5rem;
    overflow: hidden;
  }
  .chamber_info{
    width: 4rem;
    height: 5rem;
    padding: 0.2rem;
    .input_box{
      width: 100%;
      height: 0.4rem;
      .label{
        width: 1.5rem;
      }
    }
  }
}
.chamber_btn{
  height: 0.74rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.2rem;
}
</style>