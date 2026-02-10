/**
 * @Author: Travis
 * @Date: 2026-02-06 14:58:19
 * @Description: 公用底部导航
 * @LastEditTime: 2026-02-06 14:58:19
 * @LastEditors: Travis
 */
<script setup lang="ts">
import { ref } from 'vue'
  const footerList = ref([
    {
      tit:'首页',
      link:'/home',
      child:[
        {tit:'关于我们',link:''}
      ]
    },
    {
      tit:'商城',
      link:'/shop',
      child:[
        {tit:'真空泵',link:''},
        {tit:'测量仪表',link:''},
        {tit:'真空配件',link:''},
        {tit:'过滤保护装置',link:''},
      ]
    },
    {
      tit:'订单',
      link:'/order',
      child:[]
    },
    {
      tit:'二手商城',
      link:'/secondHand',
      child:[]
    }
  ])
</script>
<template>
  <div class="footer_container">
    <div class="footer_top base-box flex-fs">
      <div class="info">
        <div class="fw-700 f50 txt1">Vacuum AI</div>
        <div class="fw-500 f18 txt2">上海探氩智能科技有限公司</div>
        <div class="fw-300 f12 txt3">
          Shanghai Targon Intelligent Technology Co.，Ltd
        </div>
      </div>
      <div class="list flex-sa">
        <div class="item" v-for="item in footerList">
          <div class="tit f20 fw-300 cu">{{ item.tit }}</div>
          <div class="txt cu" v-for="ele in item.child">
            <div class="f18 fw-300">{{ ele.tit }}</div>
          </div>
        </div>
      </div>
      <div class="contact f16 fw-300 flex-sb">
        <div class="">联系电话 : +8618321395819</div>
        <div class="">联系人 : Charles Zhang</div>
        <div class="">地址 : 上海市浦东新区龙东大道3000张江集电港1幢A区12楼Z2室</div>
        <div class="">邮箱:Charles Zhang@Targon.cn</div>
      </div>
    </div>
    <div class="footer_btm f16 fw-300 text-c base-box">
      <div class="">© 2024上海探氩智能科技有限公司 版权所有</div>
      <div class="">京ICP备2024098247号-1</div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.footer_container{
  width: 100%;
  // height: 7.65rem;

}
.footer_top{
  width: 100%;
  height: 6rem;
  align-items: flex-start;
  background-color: var(--text-t);
  padding: 0.94rem 2.37rem 1rem 2.37rem;
  color: white;
  .info{
    width: 3rem;
    margin-top: 0.1rem;
    .txt1{
      height: 0.6rem;
      line-height: 0.6rem;
    }
    .txt2{
      height: 0.25rem;
      line-height: 0.25rem;
      margin-top: 0.27rem;
    }
    .txt3{
      height: 0.15rem;
      line-height: 0.15rem;
    }
  }
  .list{
    width: 7rem;
    align-items: flex-start;
    margin-left: 1rem;
    .item{
      width: 1.08rem;
      .tit{
        margin-bottom: 0.23rem;
      }
      .txt{
        margin-bottom: 0.16rem;
      }
      .tit:hover,.txt:hover{
        color: var(--theme);
      }
    }
  }
  .contact{
    width: 13rem;
    position: absolute;
    bottom: 1rem;
  }
}
.footer_btm{
  color: #808080;
  padding: 0.32rem 0 0.46rem 0;
}
</style>