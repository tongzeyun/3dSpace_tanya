<script lang="ts" setup>
import { ref , reactive , onMounted} from 'vue'
import Layer from '../Layout/markLayer.vue';
import imgUrl from '@/assets/imagePath';
// import { Chamber } from '@/interface/project';
import MiniCanvas from './miniCanvas.vue';
import { useProjectStore } from '@/store/project';
  const activeName = ref<string | number> ('0')
  const cTypeActive = ref<string | number> ('0')
  const chamberVisiable = ref<boolean> (false)
  const cvsDom = ref<InstanceType<typeof MiniCanvas> | null>(null)
  const miniReady = ref<boolean>(false)
  const projectStore = useProjectStore()
  let chamberModel :any = {}
  const baseOptions :Record< string, string >[] = [
    { 
      width:'x_size',
      height:'y_size',
      length: 'z_size',
      thickness: 'thickness',
    },
    {
      radius:'d_size',
      height:'h_size',
      thickness: 'thickness',
    },
    {
      radius:'d_size',
      height:'h_size',
      thickness: 'thickness',
    }
  ]
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
  let chamberForm = reactive<any>(projectStore.modelList[0])

  onMounted(() => {
    
  })

  const handleTypeChange = (val: string | number) => {
    // console.log(val)
    // chamberForm.cType = val
    // let Obj = baseOptions[Number(val)]
    
    initChamberMOdel(val)
  }

  const onMiniCanvasReady = () => {
    miniReady.value = true
    console.log('MiniCanvas Ready')
    if (chamberVisiable.value) {
      // cvsDom.value?.addChamberModel(chamberForm.cType)
      // showChamberPop()
      handleTypeChange(0)
      // initChamberMOdel()
    }
  }

  const initChamberMOdel = (index:number | string) => {
    console.log(chamberForm)
    index = Number(index)
    let Obj = {}  as any
    chamberForm.cType = index
    
    for (let key in baseOptions[index]) {
      let tKey = baseOptions[index][key]
      Obj[key] = chamberForm[tKey]
    }
    console.log(Obj)
    chamberModel = cvsDom.value?.addChamberModel(chamberForm.cType,{
      ...Obj
    }) 
    console.log(chamberModel)

    chamberModel?.setSeleteState(0x72b0e6)
  }

  const showChamberPop = () => {
    chamberVisiable.value = true
  }

  const handleFaceChange = () => {
    console.log(chamberForm.faceIndex)
    cvsDom.value?.addOutletModel(chamberForm.faceIndex)
    resetInput()
  }

  const handleUpdateModel = () => {
    resetInput()
    handleChangeOutletPos()
  }

  const resetInput = () => { 
    if(chamberForm.faceIndex == 0 || chamberForm.faceIndex == 2) {
      chamberForm.hole_location_x = chamberModel.length / 2
      chamberForm.hole_location_y = chamberModel.height / 2
    }else if(chamberForm.faceIndex == 1 || chamberForm.faceIndex == 3){
      chamberForm.hole_location_x = chamberModel.width / 2
      chamberForm.hole_location_y = chamberModel.height / 2
    }else if(chamberForm.faceIndex == 4 || chamberForm.faceIndex == 5){
      chamberForm.hole_location_x = chamberModel.width / 2
      chamberForm.hole_location_y = chamberModel.length / 2
    }
  }
  const handleChangeOutletPos = () => {
    cvsDom.value?.setOutletOffset(
      Number(chamberForm.hole_location_x),
      Number(chamberForm.hole_location_y)
    )
  }
</script>
<template>
  <div class="r_aside_container base-box">
    <el-tabs v-model="activeName" class="demo-tabs">
      <el-tab-pane label="属性" name="0">
        <div>属性</div>
        <el-button @click="showChamberPop">修改真空室属性</el-button>
      </el-tab-pane>
      <el-tab-pane label="模拟" name="1">模拟</el-tab-pane>
      <el-tab-pane label="设置" name="2">设置</el-tab-pane>
    </el-tabs>

    <Layer v-model="chamberVisiable" :width="'10.24rem'">
      <slot>
        <div class="chamber_form base-box">
          <div class="header flex-sb base-box">
            <div class="tit f16 fB">真空室配置</div>
            <img :src="imgUrl.close" @click="chamberVisiable = false"></img>
          </div>
          <div class="chamber_cont flex-sb base-box">
            <div class="cnv_box base-box">
              <MiniCanvas ref="cvsDom" @ready="onMiniCanvasReady" @update-chamber-model="handleUpdateModel"></MiniCanvas>
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
                      @change="handleChangeOutletPos"/>
                  </div>
                  <div class="input_box flex-sb f18">
                    <div class="label f18">Y-offset</div>
                    <el-input
                      v-model="chamberForm.hole_location_y" 
                      placeholder="请输入" 
                      @change="handleChangeOutletPos"/>
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
                  <div class="input_box flex-sb ">
                    <div class="label f18" >X-offset</div>
                    <el-input 
                      v-model="chamberForm.hole_location_x" 
                      placeholder="请输入"
                      @change="handleChangeOutletPos"/>
                  </div>
                  <div class="input_box flex-sb f18">
                    <div class="label f18">Y-offset</div>
                    <el-input
                      v-model="chamberForm.hole_location_y" 
                      placeholder="请输入" 
                      @change="handleChangeOutletPos"/>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="胶囊" name="2">设置</el-tab-pane>
              </el-tabs>
            </div>
          </div>
          <div class="chamber_btn base-box">
            <el-button @click="chamberVisiable = false">取消</el-button>
            <el-button type="primary">保存</el-button>
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