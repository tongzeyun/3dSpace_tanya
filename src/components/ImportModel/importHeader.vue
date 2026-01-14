<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import i18n from '@/i18n'
import { onMounted } from 'vue'

  const { t } = useI18n()
  const router = useRouter()

  const emit = defineEmits<{ submitModel:[] }>(

  )

  onMounted(() => {
    console.log(i18n)
  })
  const changeLang = (lang: any) => {
    try {
      sessionStorage.setItem('language', lang)
    } catch (e) {
      console.warn('sessionStorage is not available', e)
    }
    if (i18n && i18n.global && typeof i18n.global.locale !== 'undefined') {
      
      i18n.global.locale.value = lang
    }
  }
  const submitModel = () => {
    emit('submitModel')
  }
</script>
<template>
  <div class="header_box flex-sb base-box">
    <div class="header_l flex-fs">
      <img src="/img/logo.png" />
      <el-menu mode="horizontal" :ellipsis="false">
        <el-sub-menu index="1">
          <template #title>
            <div>{{ t('msg.menu.poc') }}</div>
          </template>
          <el-menu-item index="1-1">新建</el-menu-item>
          <el-menu-item index="1-2">打开</el-menu-item>
          <el-menu-item index="1-3">保存</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <div>{{ t('msg.menu.pump') }}</div>
          </template>
          <el-menu-item index="2-1">管理泵</el-menu-item>
          <el-menu-item index="2-2">管理泵数据</el-menu-item>
          <el-menu-item index="2-3" @click="router.push('/importpump')">泵数字化</el-menu-item>
          <el-menu-item index="2-3" @click="router.push('/conversion')">泵模型格式转换</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="3">
          <template #title>
            <div>{{ t('msg.menu.help') }}</div>
          </template>
          <el-menu-item index="3-1">v1.7.8</el-menu-item>
          <el-menu-item index="3-2">optimum</el-menu-item>
          <el-menu-item index="3-3">用户手册</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="4">
          <template #title>
            <div>{{ t('msg.menu.lang') }}</div>
          </template>
          <el-menu-item index="4-1" @click="changeLang('en')">英语[English]</el-menu-item>
          <el-menu-item index="4-2" @click="changeLang('zhCn')">中文(简体)</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="header_c">
      <div class="poc_name f24">
        用户自定义导入模型
      </div>
    </div>
    <div class="header_r flex-fs">
      <slot name="upload"></slot>
      <div class="logout f24">
        <el-button type="primary" @click="submitModel">提交</el-button>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.header_box{
  width: 100%;
  height: 100%;
  padding: 0 0.2rem;
  background-color: white;
}
.header_l{
  width: 2.5rem;
  height: 100%;
  img{
    width: 100%;
    height: 80%;
    margin-right: 0.2rem;
  }
  .list{
    width:fit-content;
    cursor: pointer;
    .item{
      width: fit-content;
      white-space: nowrap;
      margin-right: 0.2rem;
    }
  }
}

.header_r{
  gap: 0.2rem;
  .logout{
    cursor: pointer;
  }
}
:deep(.el-menu--horizontal.el-menu){
  border-bottom: none;
}
</style>