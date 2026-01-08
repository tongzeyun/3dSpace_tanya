<script lang="ts" setup>
import { reactive } from 'vue';
import { userApi } from '@/utils/http/index';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

  const router = useRouter();
  const userForm = reactive({
    email:'',
    username: '',
    password: '',
    password2: '',
  });


  const register = () => {
    const result = validateRegistrationForm()
    if(result !== true){
      ElMessage.error(result)
      return
    }
    userApi.register(userForm).then((_res:any) => {
      userApi.login({
        email: userForm.email,
        password: userForm.password,
      }).then((res:any) => {
        // console.log(res);
        ElMessage.success('登录成功')
        sessionStorage.setItem('token', res.access)
        sessionStorage.setItem('email', userForm.email)
      })
      ElMessage.success('注册成功')
      router.push('/login')
    }).catch (err => {
      // console.log(err);
      ElMessage.error(err.errmsg)
    })
  }

  const goLogin = () => {
    router.push('/login')
  }

  const validateRegistrationForm = () => {
    if (!userForm.email) {
      return '请输入邮箱'
    }

    const emailReg = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailReg.test(userForm.email)) {
      return '邮箱格式不正确'
    }

    if (!userForm.username) {
      return '请输入用户名'
    }

    if (userForm.username.length < 3 || userForm.username.length > 20) {
      return '用户名长度需在 3-20 位之间'
    }
    const usernameReg = /^[a-zA-Z0-9_]+$/
    if (!usernameReg.test(userForm.username)) {
      return '用户名只能包含字母、数字和下划线'
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
</script>
<template>
  <div class="login_container flex-ct">
    <div class="tit f26">注册</div>
    <div class="login_form base-box round flex-fs f24">
      <div class="login_form_input">
        <el-input v-model="userForm.email" style="width: 4rem" placeholder="请输入邮箱" />
      </div>
      <div class="login_form_input">
        <el-input v-model="userForm.username" style="width: 4rem" placeholder="请输入用户名" />
      </div>
      <div class="login_form_input">
        <el-input v-model="userForm.password" style="width: 4rem" placeholder="请输入密码" show-password type="password" />
      </div>
      <div class="login_form_input">
        <el-input v-model="userForm.password2" style="width: 4rem" placeholder="确认密码" show-password type="password"/>
      </div>
      <div class="login_form_btn text-c round" @click="register">注册</div>
      <div class="login_form_btn text-c round" @click="goLogin">去登录</div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.login_container{
  width: 100vw;
  height: 100vh;
  background-color: #aaaaaa;
}
.login_form{
  width: 6rem;
  height: fit-content;
  padding: 0.3rem 0.5rem;
  background: #fff;
  flex-direction: column;
}
.login_form_input{
  margin-bottom: 0.3rem;
}
.login_form_btn{
  width: 1.5rem;
  cursor: pointer;
  user-select: none;
  border: 1px solid #ddd;
}
.login_form_btn:hover{
  background-color: var(--theme);
  color: white;
}
</style>