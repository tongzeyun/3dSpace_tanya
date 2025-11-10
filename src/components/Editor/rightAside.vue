<script lang="ts" setup>
import { ref , reactive , onMounted} from 'vue'
import Layer from '../Layout/markLayer.vue';
import imgUrl from '@/assets/imagePath';
// import { Chamber } from '@/interface/project';
import MiniCanvas from './miniCanvas.vue';
  const activeName = ref<string | number> ('0')
  const cTypeActive = ref<string | number> ('0')
  const chamberVisiable = ref<boolean> (false)
  const cvsDom = ref<InstanceType<typeof MiniCanvas> | null>(null)
  const miniReady = ref<boolean>(false)
  const baseOptions :Record< string, string >[] = [
    { 
      width:'x_size',
      height:'y_size',
      depth: 'z_size',
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
  let chamberForm = reactive<any>({
    type: 'chamber',
    name: 'chamber',
    cType : '0',
    x_size: 1,
    y_size: 1,
    z_size: 1,
    d_size: 1,
    h_size: 1,
    thickness: 0.05,
    rotation : {x: 0, y: 0, z: 0},
    scale : {x: 1, y: 1, z: 1},
    position: {x: 0, y: 0, z: 0},
    hole_location_x: 0.5, 
    hole_location_y: 0.5, 
    hole_location_h: 0.5, 
    hole_location_r: 0.5,
  })

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
    
    index = Number(index)
    let Obj = {}  as any
    chamberForm.cType = index
    
    for (let key in baseOptions[index]) {
      let tKey = baseOptions[index][key]
      Obj[key] = chamberForm[tKey]
    }
    console.log(Obj)
    let chamberModel = cvsDom.value?.addChamberModel(chamberForm.cType,{
      // width: chamberForm.x_size,
      // height: chamberForm.y_size,
      // depth: chamberForm.z_size,
      // thickness: chamberForm.thickness,
      ...Obj
    }) 
    console.log(chamberModel)

    chamberModel?.setSeleteState(0x72b0e6)
  }

  const showChamberPop = () => {
    chamberVisiable.value = true
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

    <Layer v-model="chamberVisiable" append-to-body :width="'10.24rem'">
      <slot>
        <div class="chamber_form">
          <div class="header flex-sb base-box">
            <div class="tit f16 fB">真空室配置</div>
            <img :src="imgUrl.close" @click="chamberVisiable = false"></img>
          </div>
          <div class="chamber_cont flex-sb base-box">
            <div class="cnv_box base-box">
              <MiniCanvas ref="cvsDom" @ready="onMiniCanvasReady"></MiniCanvas>
            </div>
            <div class="chamber_info base-box">
              <el-tabs v-model="cTypeActive" @tab-change="handleTypeChange">
                <el-tab-pane label="长方体" name="0" >
                  
                </el-tab-pane>
                <el-tab-pane label="圆柱体" name="1">模拟</el-tab-pane>
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
  }
  .chamber_info{
    width: 4rem;
    height: 5rem;
    padding: 0.2rem;
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