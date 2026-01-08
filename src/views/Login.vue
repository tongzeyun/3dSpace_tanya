<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { reactive } from 'vue';
import { userApi } from '@/utils/http';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/userInfo';
  const userForm = reactive({
    email: '',
    password: ''
  });
  const router = useRouter();
  const userStore = useUserStore()
  const login = async () => {
    await userApi.login({
      email: userForm.email,
      password: userForm.password,
    }).then((res:any) => {
      // console.log(res);
      ElMessage.success('登录成功')
      sessionStorage.setItem('token', res.access)
      // sessionStorage.setItem('email', userForm.email)
      userStore.token = res.access
      userStore.refreshToken = res.refresh
      router.push('/')
      userStore.getUserInfo()
      
    })
  }
  
  const goRegister = () => {
    // console.log('注册');
    router.push('/register')
  }
</script>
<template>
  <div class="login_container flex-ct">
    <div class="tit f26">登录</div>
    <div class="login_form base-box round flex-fs f24">
      <div class="login_form_input">
        <el-input v-model="userForm.email" style="width: 4rem" placeholder="请输入邮箱"/>
      </div>
      <div class="login_form_input">
        <el-input v-model="userForm.password" style="width: 4rem" placeholder="请输入密码" type="password" show-password/>
      </div>
      <div class="login_form_btn text-c round" @click="login">登录</div>
      <div class="login_form_btn text-c round" @click="goRegister">去注册</div>
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