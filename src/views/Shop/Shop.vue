/**
 * @Author: Travis
 * @Date: 2026-03-04 09:44:47
 * @Description: 商城销售页面
 * @LastEditTime: 2026-03-04 09:44:47
 * @LastEditors: Travis
 */

<script setup lang="ts">
import { ref } from 'vue'
import Pagination from '@/components/Layout/pagination.vue'
import { useRouter } from 'vue-router'


  const router = useRouter()
  const filterMenu = ref([
    { 
      name: '真空泵', 
      children: [
        { name: '干式真空泵' },
        { name: '油封真空泵' },
        { name: '涡旋真空泵' },
        { name: '超高真空泵' },
        { name: '粗真空泵' },
        { name: '罗茨泵' },
        { name: '真空发生机组' },
        { name: '系统' }
      ]
    },
    { 
      name: '测量仪表', 
      children: [
        { name: '真空计' },
        { name: '传感器' },
        { name: '残余气体分析仪' },
        { name: '检漏仪' },
        { name: '真空开关' },
        { name: '控制器' }
      ]
    },
    { 
      name: '真空配件', 
      children: [
        { name: '法兰' },
        { name: '引入器' },
        { name: '密封件' },
        { name: '真空腔体' }
      ]
    },
    { 
      name: '定制化腔体', 
      children: [
        { name: '科研实验腔体' },
        { name: '工业工艺腔体' },
        { name: '形状定制' },
        { name: '材质定制' },
        { name: '超高真空腔体' },
        { name: '系统集成腔体' },
      ]
    },
    { 
      name: '过滤保护装置', 
      children: [
        { name: '过滤器' },
        { name: '捕集器' },
        { name: '分离器' },
        { name: '废气处理器' },
        { name: '润滑油' },
        { name: '耗材' },
        { name: '安装支架' }
      ]
    }
  ])


  // 选中的分类项
  const selectedCategories = ref<string[]>([])
  
  // 折叠面板激活项（默认展开第一项）
  const activeCollapse = ref([0])

  // 分页相关
  const currentPage = ref(1)
  const totalProducts = ref(50) // 总产品数
  const pageSize = ref(9) // 每页显示数量

  // 处理分类选择
  const handleCategoryChange = (categoryName: string, event: Event) => {
    const checked = (event.target as HTMLInputElement).checked
    if (checked) {
      if (!selectedCategories.value.includes(categoryName)) {
        selectedCategories.value.push(categoryName)
      }
    } else {
      const index = selectedCategories.value.indexOf(categoryName)
      if (index > -1) {
        selectedCategories.value.splice(index, 1)
      }
    }
    console.log('选中的分类:', selectedCategories.value)
  }

  // 产品数据
  const products = ref(Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    name: `产品名称 ${i + 1}`,
    price: 1999.00
  })))

  // 分页变化处理
  const handlePageChange = (page: number) => {
    console.log('页码变化:', page)
    // 这里可以添加加载对应页数据的逻辑
  }

  const showPocDetail = (data:any) => {
    console.log('查看产品详情:', data)
    router.push('/shop/detail')
  }
</script>
<template>
  <div class="shop_box">
    <div class="shop_banner"></div>
    <div class="shop_content base-box flex-fs">
      <!-- 左侧过滤器边栏 -->
      <div class="shop_sidebar base-box">
        <div class="sidebar_title f20 fw-700 text-l" style="color: var(--text-t);">
          VACUUM PUMP
        </div>
        <div class="sidebar_subtitle f14 text-l" style="color: var(--text-p); margin-bottom: 0.3rem;">
          真空泵
        </div>
        
        <!-- 产品类别 - 使用 el-collapse -->
        <div class="filter_section base-box">
          <el-collapse v-model="activeCollapse" class="filter_collapse">
            <el-collapse-item 
              v-for="(item, index) in filterMenu" 
              :key="index"
              :name="index"
              class="filter_collapse_item"
            >
              <template #title>
                <span class="f16 fw-500 text-l" style="color: var(--text-d);">{{ item.name }}</span>
              </template>
              <div class="filter_options base-box">
                <label 
                  v-for="(child, childIndex) in item.children" 
                  :key="childIndex" 
                  class="filter_option flex-fs cu base-box"
                >
                  <input 
                    type="checkbox" 
                    :checked="selectedCategories.includes(child.name)"
                    @change="handleCategoryChange(child.name, $event)"
                    style="width: 0.16rem; height: 0.16rem; margin-right: 0.1rem; accent-color: var(--theme);"
                  >
                  <span class="f14 text-l" style="color: var(--text-d);">{{ child.name }}</span>
                </label>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <!-- 右侧产品列表区域 -->
      <div class="shop_main base-box">
        <!-- 搜索栏 -->
        <div class="search_bar flex-sb base-box">
          <div class="search_input flex-fs base-box round-sm">
            <svg width="0.25rem" height="0.32rem" viewBox="0 0 25 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10.2936" cy="10.2934" r="9.26409" stroke="#BECEDD" stroke-width="2.05869"/>
            <line x1="15.5045" y1="19.0149" x2="23.4486" y2="30.5673" stroke="#BECEDD" stroke-width="2.05869" stroke-linecap="round"/>
            </svg>

            <input type="text" placeholder="搜索" class="f24">
          </div>
          <div class="refresh_icon cu flex-ct" style="width: 0.32rem; height: 0.32rem;">
            <svg width="0.32rem" height="0.32rem" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.89536 15.7029C2.93346 14.0381 3.27631 12.4229 3.92011 10.9029C4.57915 9.34095 5.52391 7.94286 6.72771 6.73524C7.9315 5.52762 9.3334 4.58286 10.8953 3.92381C12.5105 3.2419 14.2248 2.89524 15.9962 2.89524C17.7676 2.89524 19.4819 3.2419 21.0933 3.92381C22.6514 4.58286 24.0533 5.52762 25.2571 6.73524C25.6342 7.11238 25.9885 7.51238 26.3161 7.93143L24.0228 9.72191C23.8209 9.8781 23.8894 10.1981 24.1371 10.259L30.8303 11.8971C31.0208 11.9429 31.2075 11.7981 31.2075 11.6038L31.238 4.71238C31.238 4.45714 30.9446 4.31238 30.7465 4.47238L28.598 6.15238C25.6685 2.40381 21.1123 0 15.9924 0C7.26484 0 0.163959 6.99429 7.44514e-05 15.6876C-0.00365885 15.859 0.133483 16 0.30491 16H2.5906C2.75822 16 2.89155 15.8667 2.89536 15.7029ZM31.6951 16H29.4094C29.2418 16 29.1084 16.1333 29.1046 16.2971C29.0665 17.9619 28.7237 19.5771 28.0799 21.0971C27.4208 22.659 26.4761 24.061 25.2723 25.2648C24.0685 26.4686 22.6666 27.4171 21.1047 28.0762C19.4895 28.7581 17.7752 29.1048 16.0038 29.1048C14.2324 29.1048 12.5181 28.7581 10.9029 28.0762C9.34482 27.4171 7.94293 26.4724 6.73913 25.2648C6.362 24.8876 6.00771 24.4876 5.6801 24.0686L7.97341 22.2781C8.17531 22.1219 8.10674 21.8019 7.85912 21.741L1.16585 20.1029C0.975379 20.0571 0.788714 20.2019 0.788714 20.3962L0.762048 27.2914C0.762048 27.5467 1.05538 27.6914 1.25347 27.5314L3.40202 25.8514C6.33152 29.5962 10.8877 32 16.0076 32C24.739 32 31.836 25.0019 31.9999 16.3124C32.0037 16.141 31.8665 16 31.6951 16Z" fill="#9FA2A5"/>
            </svg>
          </div>
        </div>

        <!-- 产品网格 -->
        <div class="product_grid base-box">
          <div class="product_card base-box cu" v-for="product in products" :key="product.id" @click="showPocDetail(product)">
            <div class="product_image bg-box round-sm"></div>
            <div class="product_info base-box">
              <div class="product_name f14 text-l truncate" style="color: var(--text-d); margin-top: 0.18rem;">
                {{ product.name }}
              </div>
              <div class="product_price f16 fw-500 text-l" style="color: var(--text-t); margin-top: 0.06rem;">
                ¥{{ product.price.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination_wrapper base-box">
          <Pagination 
            v-model="currentPage" 
            :total="totalProducts" 
            :page-size="pageSize"
            @change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.shop_box{
  width: 100%;
  background-color: #fff;
}
.shop_banner{
  width: 100%;
  height: 8rem;
  background-color: var(--bg-color);
} 

.shop_content {
  width: 100%;
  padding: 1rem 2.37rem;
  align-items: flex-start;
  // gap: 0.3rem;
}

.shop_sidebar {
  width: 2.23rem;
  padding-top: 0.2rem;
  background-color: #fff;
  margin-right: 1.43rem;
}

.filter_section {
  margin-top: 0.2rem;
  padding: 0.15rem 0;
}

.filter_header {
  padding: 0.1rem 0;
}

.filter_options {
  margin-top: 0.1rem;
  // padding-left: 0.1rem;
}

.filter_option {
  padding: 0.08rem 0;
}

.filter_collapse {
  border: none;
  background-color: transparent;
  
  :deep(.el-collapse-item) {
    border: none;
    margin-bottom: 0.1rem;
  }
  
  :deep(.el-collapse-item__header) {
    border: none;
    padding: 0.1rem 0;
    height: auto;
    line-height: 1.5;
    background-color: transparent;
    
    &:hover {
      background-color: transparent;
    }
  }
  
  :deep(.el-collapse-item__arrow) {
    color: var(--text-p);
    font-size: 0.14rem;
    margin-right: 0.08rem;
  }
  
  :deep(.el-collapse-item__wrap) {
    border: none;
    background-color: transparent;
  }
  
  :deep(.el-collapse-item__content) {
    padding: 0.1rem 0 0 0;
  }
}

.shop_main {
  // flex: 1;
  // padding: 0.2rem;
  background-color: #fff;
}

.search_bar {
  margin-bottom: 0.6rem;
  gap: 0.35rem;
}

.search_input {
  flex: 1;
  // height: 0.4rem;
  background-color: #f5f5f5;
  padding: 0 0.2rem;
  svg{
    margin-right: 0.25rem;
  }
  input{
    border: none; 
    outline: none; 
    background: transparent; 
    flex: 1; 
    color: var(--text-d);
    box-sizing: border-box;
    height: 0.64rem;
  }
}

.refresh_icon {
  width: 0.32rem;
  height: 0.32rem;
}

.product_grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem 0.15rem;
  margin-bottom: 0.7rem;
}

.product_card {
  width: 3.5rem;
}

.product_image {
  width: 3.5rem;
  height: 4rem;
  aspect-ratio: 1;
  background-color: var(--bg-color);
}

.pagination_wrapper {
  margin-top: 0.3rem;
  display: flex;
  justify-content: flex-end;
}
</style>