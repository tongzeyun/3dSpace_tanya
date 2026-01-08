<script lang="ts" setup>
import { ref , reactive , onMounted , getCurrentInstance , watch} from 'vue'
// import Layer from '../Layout/markLayer.vue';
// import imgUrl from '@/assets/imagePath';
import { cloneDeep } from 'lodash'
// import { Chamber } from '@/interface/project';
// import MiniCanvas from './miniCanvas.vue';
import { useProjectStore } from '@/store/project';
import { ElMessage, ElMessageBox } from 'element-plus';
import { chamberBaseOptions } from '@/assets/js/modelBaseInfo'
import { pipeDiaOptions , gasTypeOptions} from '@/assets/js/projectInfo'
import { Flange } from '@/utils/model-fuc/Flange';
import { Port } from '@/utils/model-fuc/Port';
import { pocApi } from '@/utils/http';
  const emits = defineEmits(['updateChamber','delModel'])
  const { proxy } = getCurrentInstance() as any
  const activeTab = ref<string | number> ('0')
  
  // const chamberVisiable = ref<boolean> (false)
  // const cvsDom = ref<InstanceType<typeof MiniCanvas> | null>(null)
  // const miniReady = ref<boolean>(false)
  const projectStore = useProjectStore()
  const cTypeActive = ref<string | number> (projectStore?.modelList[0]?.cType?.toString() || "0")
  const falngeDia = ref<number>(0.016)
  let chamberForm = reactive<any>({})

  const showOutletBox = ref<boolean>(false)
  const outletOffset = ref<number[]>([0,0])
  watch(() => projectStore.activeFlange,() => {
    if(projectStore.activeClass.type == 'Chamber'){
      console.log(projectStore.activeFlange)
      showOutletBox.value = projectStore.activeClass.activeFace?.children.length > 0
      outletOffset.value = projectStore.activeFlange.offset ?? [0,0]
    }
  },{deep:true})
  onMounted(() => {
    chamberForm = reactive(cloneDeep(chamberBaseOptions))
  })
  const handleTypeChange = (val: string | number) => {
    chamberForm = reactive(cloneDeep(chamberBaseOptions))
    chamberForm.cType =  val
    emits('updateChamber',chamberForm)
    // initChamberModel(val)
    // resetInput()
  }

  const changeOutletPos = () => {
    console.log(projectStore.activeClass.activeFlange)
    // let offset = projectStore.activeClass.activeFlange.offset
    let flange:Flange = projectStore.activeClass.activeFlange.flange
    let min_x = 0
    let min_y = 0
    
    let max_x = 0, max_y = 0;
    let faceName = flange.getObject3D().parent!.name
    if(cTypeActive.value == '0'){ //长方体
      min_x = flange.params.drawDiameter/2+flange.params.thickness+projectStore.activeClass.params.thickness;
      min_y = flange.params.drawDiameter/2+flange.params.thickness+projectStore.activeClass.params.thickness;
      switch (faceName){
        case 'front':
        case 'back':
          max_x = projectStore.activeClass.params.width - min_x
          max_y = projectStore.activeClass.params.height - min_y
          break;
        case 'top':
        case 'bottom':
          max_x = projectStore.activeClass.params.length - min_x
          max_y = projectStore.activeClass.params.width - min_y
          break;
        case 'left':
        case 'right':
          max_x = projectStore.activeClass.params.length - min_x
          max_y = projectStore.activeClass.params.height - min_y
          break;
      }

    }else if (cTypeActive.value == '1'){ // 圆柱体
      let offset = flange.params.drawDiameter/2+projectStore.activeClass.params.thickness+flange.params.thickness
      min_x = 0
      min_y = offset
      max_x = projectStore.activeClass.params.diameter/2-offset
      max_y = projectStore.activeClass.params.height-offset
    }else if(cTypeActive.value == '2'){
      let offset = flange.params.drawDiameter/2+projectStore.activeClass.params.thickness+flange.params.thickness
      min_x = 0
      max_x = 0
      max_x = projectStore.activeClass.params.diameter/2-offset
      max_y = projectStore.activeClass.params.height-offset
    }
    min_x = Math.round(min_x * 100) / 100
    min_y = Math.round(min_y * 100) / 100
    max_x = Math.round(max_x * 100) / 100
    max_y = Math.round(max_y * 100) / 100
    console.log(min_x,min_y,max_x,max_y)
    outletOffset.value[0] = outletOffset.value[0] < min_x ? min_x : outletOffset.value[0]
    outletOffset.value[0] = outletOffset.value[0] > max_x ? max_x : outletOffset.value[0]
    outletOffset.value[1] = outletOffset.value[1] < min_y ? min_y : outletOffset.value[1]
    outletOffset.value[1] = outletOffset.value[1] > max_y ? max_y : outletOffset.value[1]
    projectStore.activeClass.setOutletOffset(
      Number(outletOffset.value[0]),
      Number(outletOffset.value[1])
    )
  }
  
  const changePipeLen = (e:any) => {
    console.log(Number(e))
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return
    }
    if(e < 0.15){
      ElMessage.error('Pipe length must be greater than 0.15')
      return
    }
    let s = e / projectStore.activeClass.baseLength
    projectStore.activeClass.setLength(s)
    // projectStore.activeClass.baseLength = e
  }
  const changeBendLen = (e:any) => {
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return
    }
    projectStore.activeClass.setBendAngle(e)
  }
  const changeBranchDia = (e:any) => {
    console.log(e)
    if(!validFuc(e)) return
    
    projectStore.activeClass.setBranchDiameter(e)
  }
  const validFuc = (e:any) => {
    if(isNaN(Number(e))) {
      ElMessage.error('请输入数字')
      return false
    }
    if(e < 0){
      proxy?.$message.show('Diameter must be greater than 0','error')
      return false
    }
    return true
    // if( e > projectStore.activeClass.params.mainDiameter ){
    //   proxy?.$message.show('Branch Diameter must be less than Main Diameter','error')
    //   return false
    // }
  }
  const createFlang = () => {
    projectStore.activeClass.addOutletModel({
      drawDiameter: falngeDia.value,
      actualDiameter: falngeDia.value,
    })
    outletOffset.value = projectStore.activeClass.activeFlange?.offset 
    showOutletBox.value = true
  }
  const delFlange = () => {
    ElMessageBox({
      title: '提示',
      message: '确定要删除吗？',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => { 
      projectStore.activeClass.delFlange()
    })
  }
  const changeReducerDia = () => {
    console.log(projectStore.activeClass.params.innerEnd)
    projectStore.activeClass.updateInnerEnd(projectStore.activeClass.params.innerEnd)
  }
  const deleteModel = () => {
    ElMessageBox({
      title: '提示',
      message: '确定要删除吗？',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => { 
      emits('delModel')
    })
  }
  const startCalculate = () => {
    let arr:any = []
    projectStore.modelList.forEach((item:any) => {
      let list = item.portList.reduce((a:any[], p:Port) => {
        p.parent = p.parent.id
        a.push(p)
        return a
      }, [])
      const obj = {
        type: item.type ?? '',
        params: item.params,
        id: item.id,
        portList: list
      }
      arr.push(obj)
    })
    projectStore.projectInfo.modelList = arr
    try {
      const json = JSON.stringify(projectStore.projectInfo, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'projectData_' + new Date().getTime() +'.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      // ElMessage.success('已生成并开始下载 JSON 文件')
      ElMessage.success({ message: '已生成并开始下载 JSON 文件'})
    } catch (e) {
      console.error(e)
      ElMessage.error('导出 JSON 失败')
    }
  }
  const saveProject = () => {
    let arr:any = []
    projectStore.modelList.forEach((item:any) => {
      let portList = item.portList.reduce((a:any[], p:Port) => {
        p.parent = p.parent.id
        a.push(p)
        return a
      }, [])
      const obj = {
        type: item.type ?? '',
        params: item.params,
        id: item.id,
        portList: portList,
        flangeList: item.flanges.map((f:any) => {
          f.flange.mesh = undefined;
          f.flange.port = undefined
          return f
        })
      }
      arr.push(obj)
    })
    projectStore.projectInfo.modelList = arr
    let project_json = JSON.stringify(arr)
    pocApi.updatePocById({
      id: projectStore.projectInfo.id,
      user : projectStore.projectInfo.user,
      project_name: projectStore.projectInfo.name,
      project_json
    }).then((_res) => {
      ElMessage.success('保存成功')
    }).catch(err => {
      console.error(err)
    })
  }
</script>
<template>
  <div class="r_aside_container base-box">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="数据" name="0">
        <div class="f20">基础数据</div>
        <template v-if="projectStore.activeClass?.type == 'Chamber'">
          <el-tabs v-model="cTypeActive" @tab-change="handleTypeChange">
            <el-tab-pane label="长方体" name="0" :disabled="projectStore.modelList.length > 1">
              <div class="input_box flex-sb">
                <div class="label f18">长</div>
                <el-input 
                  v-model="chamberForm.length" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">宽</div>
                <el-input 
                  v-model="chamberForm.width" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">高</div>
                <el-input 
                  v-model="chamberForm.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)" 
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f16 fB">当前选中面</div>
              <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div>

              <el-select v-model="falngeDia" value-key="id">
                <el-option
                  v-for="item in pipeDiaOptions"
                  :key="item.id"
                  :label="item.title"
                  :value="item.value"
                />
              </el-select>
              
              <el-button class="f16" @click="createFlang">添加法兰口</el-button>
              <el-button 
                class="f16" 
                @click="delFlange" 
                v-if="projectStore.activeClass.activeFlange 
                && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
              >
                删除法兰口
              </el-button>
              <div v-if="showOutletBox">
                <div class="f16 fB">法兰口设置</div>
                <div class="input_box flex-sb ">
                  <div class="label f18" >X-offset</div>
                  <el-input 
                    v-model="outletOffset[0]" 
                    placeholder="请输入"
                    @change="changeOutletPos"/>
                </div>
                <div class="input_box flex-sb f18">
                  <div class="label f18">Y-offset</div>
                  <el-input
                    v-model="outletOffset[1]" 
                    placeholder="请输入" 
                    @change="changeOutletPos"/>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="圆柱体" name="1" :disabled="projectStore.modelList.length > 1">
              <div class="input_box flex-sb">
                <div class="label f18">直径</div>
                <el-input 
                  v-model="chamberForm.diameter" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">高度</div>
                <el-input 
                  v-model="chamberForm.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f16 fB">当前选中面</div>
              <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div>

              <el-select v-model="falngeDia" value-key="id">
                <el-option
                  v-for="item in pipeDiaOptions"
                  :key="item.id"
                  :label="item.title"
                  :value="item.value"
                />
              </el-select>
              
              <el-button class="f16" @click="createFlang">添加法兰口</el-button>
              <el-button 
                class="f16" 
                @click="delFlange" 
                v-if="projectStore.activeClass.activeFlange 
                && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
              >
                删除法兰口
              </el-button>
              <div v-if="showOutletBox">
                <div class="f16 fB">法兰口设置</div>
                <div class="input_box flex-sb" v-if="projectStore.activeClass.activeFace.name == 'side'">
                  <div class="label f18" >H-offset</div>
                    <el-input 
                      v-model="outletOffset[1]" 
                      placeholder="请输入"
                      @change="changeOutletPos"/>
                </div>
                <div class="input_box flex-sb f18" v-else>
                  <div class="label f18">R-offset</div>
                  <el-input
                    v-model="outletOffset[0]" 
                    placeholder="请输入" 
                    @change="changeOutletPos"/>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="胶囊" name="2" :disabled="projectStore.modelList.length > 1">
              <div class="input_box flex-sb">
                <div class="label f18">直径</div>
                <el-input 
                  v-model="chamberForm.diameter" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="input_box flex-sb">
                <div class="label f18">高度</div>
                <el-input 
                  v-model="chamberForm.height" 
                  placeholder="请输入" 
                  @change="emits('updateChamber',chamberForm)"
                  :disabled="projectStore.modelList.length > 1"
                />
              </div>
              <div class="f16 fB">当前选中面</div>
              <div class="f16">{{ projectStore.activeClass.activeFace?.name }}</div>

              <el-select v-model="falngeDia" value-key="id">
                <el-option
                  v-for="item in pipeDiaOptions"
                  :key="item.id"
                  :label="item.title"
                  :value="item.value"
                />
              </el-select>
              
              <el-button class="f16" @click="createFlang">添加法兰口</el-button>
              <el-button 
                class="f16" 
                @click="delFlange" 
                v-if="projectStore.activeClass.activeFlange 
                && !projectStore.activeClass.activeFlange.flange.getPort().isConnected"
              >
                删除法兰口
              </el-button>
              <div v-if="showOutletBox">
                <div class="f16 fB">法兰口设置</div>
                <div class="input_box flex-sb f18" v-if="projectStore.activeClass.activeFace.name == 'side'">
                  <div class="label f18">H-offset</div>
                  <el-input
                    v-model="outletOffset[1]" 
                    placeholder="请输入" 
                    @change="changeOutletPos"/>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
          
        </template>
        <template v-if="projectStore.activeClass?.type == 'Pipe'">
          <div class="f24">类型:直管</div>
          <div class="length f20">
            长度 
          </div>
          <el-input v-model="projectStore.activeClass.newLength" @change="changePipeLen">
          </el-input>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Bend'">
          <div class="f24">类型:弯管</div>
          <div class="length f20">
            弯曲角度
          </div>
          <el-input v-model="projectStore.activeClass.params.bendAngleDeg" @change="changeBendLen"></el-input>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Tee'">
          <div class="f24">类型:三通</div>
          <div class="length f20">
            分支管径
          </div>
          <el-input v-model="projectStore.activeClass.params.branchDiameter" @change="changeBranchDia"></el-input>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Reducer'">
          <div class="f24">类型:异径管</div>
          <div class="length f20">
            出气口管径
          </div>
          <el-input v-model="projectStore.activeClass.params.innerEnd" @change="changeReducerDia"></el-input>
        </template>
        <template v-if="projectStore.activeClass?.type == 'Cross'">
          <div class="f24">类型:四通管</div>
          <div class="length f20">
            分支管径
          </div>
          <el-input v-model="projectStore.activeClass.params.innerBranch" @change="changeBranchDia"></el-input>
        </template>
        <el-button @click="deleteModel" v-if="projectStore.activeClass?.type !== 'Chamber'">
          删除模型
        </el-button>
      </el-tab-pane>
      <el-tab-pane label="模拟" name="1">
        <el-select v-model="projectStore.projectInfo.gasType" value-key="id">
          <el-option
            v-for="item in gasTypeOptions"
            :key="item.id"
            :label="item.title"
            :value="item.value"
          />
        </el-select>
        <el-button @click="startCalculate">calculate</el-button>
      </el-tab-pane>
      <el-tab-pane label="设置" name="2">设置</el-tab-pane>
    </el-tabs>
    <div class="save_btn">
      <el-button @click="saveProject">保存场景</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.r_aside_container{
  height: 100%;
  padding: 0 0.1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.input_box{
  width: 100%;
  height: 0.4rem;
  .label{
    width: 1.5rem;
  }
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
    
  }
  
}
.chamber_btn{
  height: 0.74rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.2rem;
}
.save_btn{
  width: 100%;
  height: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  .el-button{
    width: 100% !important;
  }
}
</style>