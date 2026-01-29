<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { reactive, onUnmounted } from 'vue';
import { debounce } from 'lodash'
import { userApi } from '@/utils/http';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/userInfo';
import  imgUrl  from '@/assets/imagePath';
  const userForm = reactive({
    email: '',
    password: ''
  });
  const router = useRouter();
  const userStore = useUserStore()
  const rawLogin = async () => {
    try {
      const res: any = await userApi.login({
        email: userForm.email,
        password: userForm.password,
      });
      ElMessage.success('登录成功');
      sessionStorage.setItem('token', res.access);
      userStore.token = res.access;
      userStore.refreshToken = res.refresh;
      router.push('/');
      userStore.getUserInfo();
    } catch (err: any) {
      const msg = err?.message || '登录失败';
      ElMessage.error(msg);
    }
  };

  const login = debounce(rawLogin, 1000);

  onUnmounted(() => {
    (login as any).cancel && (login as any).cancel()
  })
  
  const goRegister = () => {
    // console.log('注册');
    router.push('/register')
  }
</script>
<template>
  <div class="login_container base-box flex-ct">
    <img class="login_bg" :src="imgUrl.login_bg"/>
    <img class="login_bg" :src="imgUrl.login_bg"/>
    <div class="login_form base-box round-sm flex-fs">
      <img class="logo_img" :src="imgUrl.logo" alt="logo">
      <div class="login_tit f32">Vacuum <span>AI</span></div>
      <div class="login_txt f24">请输入您的准确账户便于顺利登录账号</div>
      <div class="login_box f20 round-sm base-box flex-fs">
        <div class="login_item">
          <div class="login_item_tit">邮箱</div>
          <el-input v-model="userForm.email" placeholder="请输入邮箱"/>
        </div>
        <div class="login_item">
          <div class="login_item_tit">密码</div>
          <el-input v-model="userForm.password" placeholder="请输入密码" type="password" show-password/>
        </div>
        <div class="login_go f14 fw-200 cu text-r" @click="goRegister">去注册？</div>
        <div class="login_form_btn text-c round-sm f24" @click="login">确认</div>
      </div>
    </div>
  </div>
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
  .login_txt{
    color: var(--text-p);
    font-weight: 500;
    margin-top: 0.88rem;
  }
  .login_box{
    background-color: white;
    width: 5.2rem;
    height: 3.6rem;
    flex-direction: column;
    padding: 0.35rem;
    margin-top: 0.4rem;
    .login_item{
      width: 100%;
      // margin-bottom: 0.2rem;
      .login_item_tit{
        height: 0.3rem;
        line-height: 0.3rem;
        color: var(--text-t);
        font-weight: 700;
        user-select: none;
      }
    }
    .login_item:nth-of-type(1){
      margin-bottom: 0.2rem;
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