/**
 * @Author: Travis
 * @Date: 2026-03-04 17:12:44
 * @Description: 用户购物车列表
 * @LastEditTime: 2026-03-04 17:12:44
 * @LastEditors: Travis
 */

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/userInfo'

const userStore = useUserStore()
const { 
  cartItems, 
  selectAll, 
  totalPrice
} = storeToRefs(userStore)

const { 
  decreaseQuantity, 
  increaseQuantity, 
  changeQuantity, 
  deleteItem 
} = userStore

// 结算
const handleCheckout = () => {
  const selectedItems = cartItems.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    console.log('请选择要结算的商品')
    ElMessage.warning('请选择要结算的商品')
    return
  }
  console.log('结算', selectedItems)
}
</script>

<template>
  <div class="cart_page base-box">
    <!-- 搜索栏 -->
    <div class="search_bar base-box flex-fs">
      <div class="search_input flex-fs base-box round-sm">
        <svg width="0.25rem" height="0.32rem" viewBox="0 0 25 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10.2936" cy="10.2934" r="9.26409" stroke="#BECEDD" stroke-width="2.05869"/>
          <line x1="15.5045" y1="19.0149" x2="23.4486" y2="30.5673" stroke="#BECEDD" stroke-width="2.05869" stroke-linecap="round"/>
        </svg>
        <input type="text" placeholder="搜索" class="f24">
      </div>
    </div>

    <!-- 购物车标题和表头 -->
    <div class="cart_header base-box flex-sb">
      <div class="cart_title f20 fw-700 text-l">
        购物车
      </div>
      <div class="cart_table_header flex-fs">
        <div class="header_col header_quantity f14 text-c">数量</div>
        <div class="header_col header_price f14 text-c">价格</div>
        <div class="header_col header_action f14 text-c">操作</div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="cart_items base-box">
      <div class="cart_item base-box flex-fs" v-for="item in cartItems" :key="item.id">
        <!-- 选择框 -->
        <div class="item_checkbox flex-ct">
          <input type="checkbox" v-model="item.selected" class="checkbox_input"/>
        </div>

        <!-- 商品图片 -->
        <div class="item_image bg-box round-sm"></div>

        <!-- 商品信息 -->
        <div class="item_info base-box">
          <div class="item_name f14 fw-500 text-l">
            {{ item.name }}
          </div>
          <div class="item_model f12 text-l">
            型号:{{ item.model }}
          </div>
          <div class="item_pn f12 text-l">
            PN: {{ item.pn }}
          </div>
        </div>

        <div class="item_right flex-sb">
          <!-- 数量控制 -->
          <div class="item_quantity base-box flex-ct">
            <div class="quantity_control flex-fs base-box">
              <button class="quantity_btn cu flex-ct" @click="decreaseQuantity(item)">-</button>
              <input v-model.number="item.quantity"  class="quantity_input text-c" @change="changeQuantity(item)"/>
              <button class="quantity_btn cu flex-ct" @click="increaseQuantity(item)">+</button>
            </div>
          </div>

          <!-- 价格 -->
          <div class="item_price base-box flex-ct">
            <span class="f16 fw-500">¥{{ item.price }}</span>
          </div>

          <!-- 操作 -->
          <div class="item_action base-box flex-ct">
            <div class="delete_btn cu flex-ct bg-box" @click="deleteItem(item.id)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部结算区域 -->
    <div class="cart_footer base-box flex-sb">
      <div class="footer_select_all flex-fs">
        <input 
          type="checkbox" 
          v-model="selectAll"
          class="checkbox_input"
        />
        <span class="f14">全选</span>
      </div>
      <div class="footer_total base-box flex-fs">
        <span class="f14">合计:</span>
        <span class="f20 fw-700 total_price">¥{{ totalPrice }}</span>
      </div>
      <button class="checkout_btn cu flex-ct round f16 fw-500" @click="handleCheckout">
        结算
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cart_page {
  width: 100%;
  padding: 0.4rem 2.37rem 1rem;
  background-color: #fff;
}

.search_bar {
  margin-bottom: 0.3rem;
}

.search_input {
  flex: 1;
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

.cart_header {
  padding: 0.3rem 0;
  border-bottom: 1px solid #E0E0E0;
  margin-bottom: 0.2rem;
}

.cart_title {
  color: var(--text-t);
}

.cart_table_header {
  gap: 1.5rem;
}

.header_col {
  color: var(--text-d);
  min-width: 0.8rem;
}

.header_quantity {
  width: 1.2rem;
}

.header_price {
  width: 1rem;
}

.header_action {
  width: 0.8rem;
}

.cart_items {
  margin-bottom: 0.3rem;
}

.cart_item {
  padding: 0.3rem 0;
  border-bottom: 1px solid #F5F5F5;
  gap: 0.2rem;
  // align-items: flex-start;
}

.item_checkbox {
  width: 0.3rem;
  height: 0.3rem;
}

.checkbox_input {
  width: 0.18rem;
  height: 0.18rem;
  accent-color: var(--theme);
  cursor: pointer;
}

.item_image {
  width: 1.2rem;
  height: 1.2rem;
  background-color: var(--bg-color);
  flex-shrink: 0;
}

.item_info {
  flex: 1;
  min-width: 0;
}

.item_name {
  color: var(--text-t);
  margin-bottom: 0.08rem;
}

.item_model,
.item_pn {
  color: var(--text-p);
  margin-top: 0.05rem;
}
.item_right{
  width: 6rem;
}
.item_quantity {
  width: 1.2rem;
}

.quantity_control {
  height: 0.4rem;
}

.quantity_btn {
  width: 0.4rem;
  height: 100%;
  border: 1px solid #E0E0E0;
  background-color: transparent;
  color: var(--text-d);
  font-size: 0.18rem;
  
  &:hover {
    background-color: var(--bg-color);
    color: var(--theme);
  }
}

.quantity_input {
  width: 0.8rem;
  box-sizing: border-box;
  height: 100%;
  border: 1px solid #E0E0E0;
  outline: none;
  background-color: transparent;
  color: var(--text-t);
  font-size: 0.14rem;
  border-left: none;
  border-right: none;
}

.item_price {
  width: 1rem;
  color: var(--text-t);
}

.item_action {
  width: 0.8rem;
}

.delete_btn {
  width: 0.2rem;
  height: 0.2rem;
  background-image: url('/public/img/cart_del.png');
  &:hover {
    background-image: url('/public/img/cart_del_h.png');
  }
}

.cart_footer {
  padding: 0.3rem 0;
  border-top: 1px solid #E0E0E0;
  margin-top: 0.3rem;
  align-items: center;
}

.footer_select_all {
  gap: 0.1rem;
  color: var(--text-d);
  
  span {
    color: var(--text-d);
  }
}

.footer_total {
  gap: 0.1rem;
  color: var(--text-d);
}

.total_price {
  color: var(--text-t);
}

.checkout_btn {
  width: 1.2rem;
  height: 0.5rem;
  background-color: var(--theme);
  color: #fff;
  border: none;
  
  &:hover {
    opacity: 0.9;
  }
}
</style>