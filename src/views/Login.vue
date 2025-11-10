<script lang="ts" setup>
import { reactive } from 'vue';

  const userForm = reactive({
    username: '',
    password: ''
  });

  const login = () => {
    if(userForm.username == 'travis' && userForm.password =='123456'){
      sessionStorage.setItem('Token', userForm.username);
      window.location.href = '/';
      userForm.username = ''
      userForm.password = ''
    }
  }
  
</script>
<template>
  <div class="login_container flex-ct">
    <div class="login_form base-box round flex-fs f24">
      <div class="login_form_input">
        <el-input v-model="userForm.username" style="width: 4rem" placeholder="请输入用户名" />
      </div>
      <div class="login_form_input">
        <el-input v-model="userForm.password" style="width: 4rem" placeholder="请输入密码" />
      </div>
      <div class="login_form_btn text-c round" @click="login">登录</div>
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