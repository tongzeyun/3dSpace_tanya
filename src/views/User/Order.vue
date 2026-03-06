/**
 * @Author: Travis
 * @Date: 2026-03-06 13:49:07
 * @Description: 我的订单页面
 * @LastEditTime: 2026-03-06 13:49:07
 * @LastEditors: Travis
 */

<script lang="ts" setup>
import { ref } from 'vue'
import Pagination from '@/components/Layout/pagination.vue'

// 订单状态筛选
const statusList = ref([
  { label: '全部', value: 'all', active: true },
  { label: '待支付', value: 'pending', active: false },
  { label: '已支付', value: 'paid', active: false },
  { label: '已发货', value: 'shipped', active: false },
  { label: '已完成', value: 'completed', active: false },
  { label: '售后中', value: 'aftersales', active: false }
])

// 切换订单状态
const switchStatus = (item: any) => {
  statusList.value.forEach(s => s.active = false)
  item.active = true
}

// 订单列表数据
const orderList = ref([
  {
    id: 1,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'paid',
    statusText: '已支付',
    date: '2026.06.12/12:00'
  },
  {
    id: 2,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'pending',
    statusText: '待支付',
    date: '2026.06.12/12:00'
  },
  {
    id: 3,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'paid',
    statusText: '已支付',
    date: '2026.06.12/12:00'
  },
  {
    id: 4,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'paid',
    statusText: '已支付',
    date: '2026.06.12/12:00'
  },
  {
    id: 5,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'paid',
    statusText: '已支付',
    date: '2026.06.12/12:00'
  },
  {
    id: 6,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'pending',
    statusText: '待支付',
    date: '2026.06.12/12:00'
  },
  {
    id: 7,
    productName: '全量程真空计TPG2810',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B',
    price: 13900,
    quantity: 1,
    status: 'paid',
    statusText: '已支付',
    date: '2026.06.12/12:00'
  }
])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(7)

const handlePageChange = (page: number) => {
  currentPage.value = page
  // 这里可以添加加载订单数据的逻辑
}

// 查看订单详情
const viewOrder = (order: any) => {
  console.log('查看订单', order)
  // 这里可以添加跳转到订单详情页的逻辑
}
</script>
<template>
  <div class="order_page base-box">
    <!-- 搜索栏 -->
    <div class="search_bar base-box flex-ct">
      <div class="search_input flex-fs base-box round-sm">
        <svg width="0.25rem" height="0.32rem" viewBox="0 0 25 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10.2936" cy="10.2934" r="9.26409" stroke="#BECEDD" stroke-width="2.05869"/>
          <line x1="15.5045" y1="19.0149" x2="23.4486" y2="30.5673" stroke="#BECEDD" stroke-width="2.05869" stroke-linecap="round"/>
        </svg>
        <input type="text" placeholder="搜索" class="f24">
      </div>
    </div>

    <!-- 订单状态筛选 -->
    <div class="status_filter base-box flex-fs">
      <div 
        v-for="(item, index) in statusList" 
        :key="index"
        class="status_item f16 fw-300 cu"
        :class="{ active: item.active }"
        @click="switchStatus(item)"
      >
        {{ item.label }}
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="order_list base-box">
      <div 
        v-for="order in orderList" 
        :key="order.id"
        class="order_item base-box flex-fs"
      >
        <!-- 产品图片占位 -->
        <div class="order_image bg-box round-sm"></div>
        
        <!-- 产品信息 -->
        <div class="order_info base-box">
          <div class="product_name f14 fw-500 text-l">
            {{ order.productName }}
          </div>
          <div class="product_model f12 text-l">
            型号: {{ order.model }}
          </div>
          <div class="product_pn f12 text-l">
            PN: {{ order.pn }}
          </div>
        </div>

        <!-- 价格和数量 -->
        <div class="order_price_quantity base-box flex-ct">
          <div class="price_quantity_wrapper base-box">
            <div class="order_price f16 fw-500 text-l">
              ¥{{ order.price }}
            </div>
            <div class="order_quantity f14 text-l">
              ×{{ order.quantity }}
            </div>
          </div>
        </div>

        <!-- 订单状态和日期 -->
        <div class="order_status_date base-box">
          <div 
            class="order_status f14 fw-500 text-l"
            :class="{ 'status_pending': order.status === 'pending' }"
          >
            {{ order.statusText }}
          </div>
          <div class="order_date f12 text-l">
            {{ order.date }}
          </div>
        </div>

        <!-- 查看按钮 -->
        <div class="order_action base-box flex-ct">
          <button class="view_btn cu flex-ct round-sm f14 fw-300" @click="viewOrder(order)">
            查看
          </button>
        </div>
      </div>
    </div>

    <!-- 分页器 -->
    <div class="pagination_wrapper base-box">
      <Pagination 
        v-model="currentPage"
        :total="total"
        :page-size="pageSize"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>
<style scoped lang="scss">
.order_page {
  width: 100%;
  padding: 0.4rem 2.37rem 1rem;
  background-color: #fff;
}

.search_bar {
  margin-bottom: 0.3rem;
}

.search_input {
  width: 100%;
  max-width: 8rem;
  background-color: #f5f5f5;
  padding: 0 0.2rem;
  height: 0.5rem;
  
  svg {
    margin-right: 0.15rem;
  }
  
  input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    color: var(--text-d);
    box-sizing: border-box;
    height: 100%;
    
    &::placeholder {
      color: var(--text-p);
    }
  }
}

.status_filter {
  margin-bottom: 0.3rem;
  gap: 0.4rem;
  padding: 0.2rem 0;
}

.status_item {
  color: var(--text-d);
  padding: 0.1rem 0;
  position: relative;
  cursor: pointer;
  
  &.active {
    color: var(--text-t);
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--theme);
    }
  }
  
  &:hover {
    color: var(--text-t);
  }
}

.order_list {
  margin-bottom: 0.4rem;
}

.order_item {
  padding: 0.3rem 0;
  border-bottom: 1px solid #F5F5F5;
  gap: 0.3rem;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
}

.order_image {
  width: 1.2rem;
  height: 1.2rem;
  background-color: var(--bg-color);
  flex-shrink: 0;
}

.order_info {
  flex: 1;
  min-width: 0;
}

.product_name {
  color: var(--text-t);
  margin-bottom: 0.08rem;
}

.product_model,
.product_pn {
  color: var(--text-p);
  margin-top: 0.05rem;
}

.order_price_quantity {
  width: 1.8rem;
  justify-content: flex-start;
  align-items: flex-start;
}

.price_quantity_wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.order_price {
  color: var(--text-t);
}

.order_quantity {
  color: var(--text-d);
}

.order_status_date {
  width: 2.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  align-items: flex-start;
}

.order_status {
  color: var(--text-t);
  
  &.status_pending {
    color: var(--theme);
  }
}

.order_date {
  color: var(--text-p);
}

.order_action {
  width: 1.2rem;
  justify-content: flex-end;
}

.view_btn {
  width: 0.8rem;
  height: 0.36rem;
  background-color: transparent;
  border: 1px solid #9FA2A5;
  color: var(--text-d);
  
  &:hover {
    background-color: var(--bg-color);
    border-color: var(--theme);
    color: var(--theme);
  }
}

.pagination_wrapper {
  margin-top: 0.4rem;
  padding-top: 0.3rem;
}
</style>