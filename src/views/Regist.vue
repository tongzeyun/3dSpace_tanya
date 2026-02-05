/**
 * @Author: Travis
 * @Date: 2026-01-07 15:22:37
 * @Description: 注册页面
 * @LastEditTime: 2026-01-07 15:22:37
 * @LastEditors: Travis
 */
<script lang="ts" setup>
import { reactive , ref , onMounted} from 'vue';
import { userApi } from '@/utils/http/index';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import imgUrl from '@/assets/imagePath/index';
import Layer from '@/components/Layout/markLayer.vue';
  const router = useRouter();
  const userForm = reactive({
    email:'',
    username: '',
    password: '',
    password2: '',
  });
  // 存放来自地址栏的查询参数
  const queryParams = ref<Record<string, string>>({})
  const checkEmailVis = ref<boolean>(false)
  const register = () => {
    const result = validateRegistrationForm()
    if(result !== true){
      ElMessage.error(result)
      return
    }
    userApi.register(userForm).then((_res:any) => {
      checkEmailVis.value = true
    }).catch (err => {
      console.log(err);
      ElMessage.error(err.error_message || '验证邮件发送失败')
    })
  }

  function getParamEverywhere(name: string): string | null {
    const match = window.location.href.match(new RegExp('[?&]' + name + '=([^&#]*)'))
    return match ? match[1] : null
  }

  onMounted( async () => {
    // console.log('register onMounted')
    try {
      console.log(window.location)
      const uid = getParamEverywhere('uid')
      const token = getParamEverywhere('token')
      if (uid || token) {
        const obj: Record<string, string> = {}
        if (uid) obj.uid = uid
        if (token) obj.token = token
        queryParams.value = obj
        console.log('queryParams', queryParams.value)
        await verifyEmail()
      }
    } catch (e) {
      console.error('解析地址栏参数失败', e)
    }
  })

  // const goLogin = () => {
  //   router.push('/login')
  // }

  const validateRegistrationForm = () => {
    if (!userForm.email) {
      return '请输入邮箱'
    }

    const emailReg = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailReg.test(userForm.email)) {
      return '邮箱格式不正确'
    }

    // 3. 密码校验
    if (!userForm.password) {
      return '请输入密码'
    }

    if (userForm.password.length < 8) {
      return '密码长度不能少于 8 位'
    }

    // 必须包含字母和数字
    const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!passwordReg.test(userForm.password)) {
      return '密码必须包含字母和数字'
    }

    // 4. 确认密码
    if (!userForm.password2) {
      return '请确认密码'
    }

    if (userForm.password !== userForm.password2) {
      return '两次输入的密码不一致'
    }

    // 校验通过
    return true
  }

  function maskEmail(email: string) {
    const e = (email || '').toString()
    const at = e.indexOf('@')
    if (at <= 0) {
      if (!e) return ''
      if (e.length <= 2) return e.replace(/./g, '*')
      return e[0] + '*'.repeat(Math.max(1, e.length - 2)) + e[e.length - 1]
    }
    const local = e.slice(0, at)
    const domain = e.slice(at)
    const head = 2
    const tail = 2
    if (local.length <= head + tail) {
      if (local.length <= 2) return local[0] + '*' + domain
      return local[0] + '*' + local[local.length - 1] + domain
    }
    const starsCount = 2
    const maskedLocal = local.slice(0, head) + '*'.repeat(starsCount) + local.slice(local.length - tail)
    return maskedLocal + domain
  }

  const resendVerifyEmail = () => {
    userApi.resendVerifyEmail().then((_res:any) => {
      ElMessage.success('已重新发送验证邮件')
    }).catch (err => {

      ElMessage.error(err.error_message || '验证邮件发送失败')
    })
  }

  const verifyEmail = async () => {
    await userApi.verifyEmail(queryParams.value).then((_res:any) => {
      router.push('/login')
      ElMessage.success('验证成功')
    }).catch (err => {
      ElMessage.error(err.error_message || '验证失败')
    })
  }
</script>
<template>
  <div class="login_container flex-ct">
    <img class="login_bg" :src="imgUrl.login_bg"/>
    <img class="login_bg" :src="imgUrl.login_bg"/>
    <div class="login_form base-box round-sm flex-fs">
      <img class="logo_img" :src="imgUrl.logo" alt="logo">
      <div class="login_tit f32">Vacuum <span>AI</span></div>
      <div class="login_box f20 round-sm base-box flex-fs">
        <div class="login_item">
          <div class="login_item_tit">邮箱</div>
          <el-input v-model="userForm.email" placeholder="请输入邮箱"/>
        </div>
        <div class="login_item">
          <div class="login_item_tit">用户名</div>
          <el-input v-model="userForm.username" name="reg_pwd_2024" placeholder="请输入用户名" autocomplete="new-username"/>
        </div>
        <div class="login_item">
          <div class="login_item_tit">设置密码</div>
          <el-input v-model="userForm.password" name="reg_pwd_2025" placeholder="请输入密码" type="password" show-password autocomplete="new-password"/>
        </div>
        <div class="login_item">
          <div class="login_item_tit">确认密码</div>
          <el-input v-model="userForm.password2" placeholder="确认密码" type="password" show-password/>
        </div>
        <div class="login_go f14 fw-200 cu text-r" @click="router.push('/login')">去登录？</div>
        <div class="login_form_btn text-c round-sm f24" @click="register">确认</div>
      </div>
    </div>
  </div>
  <Layer append-to-body v-model="checkEmailVis" width="8.75rem">
    <div class="check_box round base-box flex-ct">
      <div class="txt1 f24 fw-300">
        我们已经向您注册的
        <span class="fw-500">{{ maskEmail(userForm.email) }}</span>
        发送了验证邮件，请检查您的邮箱
      </div> 
      <div class="txt2 f28 fw-300">邮箱验证链接在发送后15分钟有效</div>
      <div class="txt3 f28 fw-300">如您未收到验证邮件，请点此处<span class="cu" @click="resendVerifyEmail">重新发送</span>验证邮件</div>
      <div class="btn f28 base-box round-sm cu" @click="router.push('/login')">已经校验完成，去登陆</div>
    </div>
  </Layer>
</template>
<style lang="scss" scoped>
.login_container{
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-color);
  .login_bg{
    width: 7rem;
    height: 5.6rem;
    position: absolute;
  }
  .login_bg:nth-of-type(1){
    bottom: 0;
    left: 0;
  }
  .login_bg:nth-of-type(2){
    bottom: 0;
    right: 0;
  }
}
.login_form{
  width: 6rem;
  height: fit-content;
  padding: 0.3rem 0.5rem;
  // background: #fff;
  flex-direction: column;
  .logo_img{
    width: 0.87rem;
    height: 0.75rem;
  }
  .login_tit{
    margin-top: 0.06rem;
    font-weight: 500;
    color: var(--text-t);
    span{
      color: var(--theme);
    }
  }
  .login_box{
    background-color: white;
    width: 5.2rem;
    height: 5.65rem;
    flex-direction: column;
    padding: 0.35rem;
    margin-top: 0.4rem;
    box-shadow: 0px 0px 24px 0px #66748040;

    .login_item{
      width: 100%;
      margin-top: 0.2rem;
      .login_item_tit{
        height: 0.3rem;
        line-height: 0.3rem;
        color: var(--text-t);
        font-weight: 700;
        user-select: none;
      }
    }
    .login_item:nth-of-type(1){
      margin-top: 0rem;
    }
    .login_go{
      width: 100%;
      height: 0.21rem;
      line-height: 0.21rem;
      color: var(--theme);
    }
  }
  
  .login_form_btn{
    width: 100%;
    height: 0.53rem;
    line-height: 0.53rem;
    margin-top: 0.3rem;
    background-color: var(--theme);
    color: white;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
  }
}
.check_box{
  width: 100%;
  height: 4.15rem;
  padding: 0.1rem;
  border: 2px dashed #75778433;
  background-color: white;
  flex-direction: column;
  color: var(--text-t);
  .txt1{
    margin-bottom: 0.2rem;
  }
  .txt2{
    color: #0130FF;
    margin-bottom: 0.5rem;
  }
  .txt3{
    margin-bottom: 0.3rem;
    span{
      color: #FF7777;
    }
  }
  .btn{
    border: 1px solid #75778433;
    padding: 0.1rem 0.2rem;
  }
}
:deep(.el-input__inner){
  height: 0.53rem;
  font-size: 0.2rem;
  color: var(--text-p) !important;
}
:deep(.el-input__wrapper){
  height: 0.53rem;
  font-size: 0.2rem;
  color: var(--text-p) !important;
}
</style>