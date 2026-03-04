/**
 * @Author: Travis
 * @Date: 2026-03-04 16:05:37
 * @Description: 商品详情页
 * @LastEditTime: 2026-03-04 16:05:37
 * @LastEditors: Travis
 */
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import imgUrl from '@/assets/imagePath'
  const router = useRouter()
  // 产品数据
  const productInfo = {
    name: '全量程真空计TPG2810',
    sellingPrice: 890,
    marketPrice: 1000,
    manufacturer: '德国蒂隆真空',
    deliveryCycle: '1-14天',
    model: 'TPG2810',
    pn: 'TPG 281 A010 10B'
  }

  const quantity = ref<number>(1)

  // 缩略图列表
  const thumbnails = ref(Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    url: '' // 预留图片位置
  })))

  const mainImageIndex = ref(0)

  // 数量增减
  const decreaseQuantity = () => {
    if (quantity.value > 1) {
      quantity.value--
    }
  }

  const increaseQuantity = () => {
    quantity.value++
  }

  // 选择主图
  const selectMainImage = (index: number) => {
    mainImageIndex.value = index
  }

  // 购买和加入购物车
  const handleBuyNow = () => {
    console.log('立即购买', quantity.value)
  }

  const handleAddToCart = () => {
    console.log('加入购物车', quantity.value)
  }


  const changeQuantity = () => {
    // 如果不是数字或者是NaN，设置为1
    if (isNaN(quantity.value) || typeof quantity.value !== 'number') {
      quantity.value = 1
      return
    }
    
    // 如果是小数，向下取整
    if (quantity.value % 1 !== 0) {
      quantity.value = Math.floor(quantity.value)
    }
    
    // 如果小于1，设置为1
    if (quantity.value < 1) {
      quantity.value = 1
    }
    
    console.log('修改数量', quantity.value)
  }
</script>

<template>
  <div class="detail_page base-box">
    <!-- 面包屑导航 -->
    <div class="breadcrumb base-box flex-fs f16">
      <span class="cu" @click="router.push('/shop/shop')">商城</span>
      <span class="breadcrumb_separator">></span>
      <span>真空计</span>
    </div>

    <!-- 产品标题 -->
    <div class="product_title base-box f32 fw-700 text-l">
      {{ productInfo.name }}
    </div>

    <!-- 产品信息区域 -->
    <div class="product_section base-box flex-fs">
      <!-- 左侧图片区域 -->
      <div class="product_images base-box flex-fs">
        <!-- 缩略图列表 -->
        <div class="thumbnail_list base-box">
          <div 
            class="thumbnail_arrow cu flex-ct" 
            @click="mainImageIndex > 0 && mainImageIndex--"
            :class="{ disabled: mainImageIndex === 0 }"
          >
            <span>∧</span>
          </div>
          <div class="thumbnail_container base-box">
            <div 
              v-for="(thumb, index) in thumbnails" 
              :key="thumb.id"
              class="thumbnail_item base-box cu round-sm"
              :class="{ active: index === mainImageIndex }"
              @click="selectMainImage(index)"
            >
              <div class="thumbnail_placeholder bg-box"></div>
            </div>
          </div>
          <div 
            class="thumbnail_arrow cu flex-ct" 
            @click="mainImageIndex < thumbnails.length - 1 && mainImageIndex++"
            :class="{ disabled: mainImageIndex === thumbnails.length - 1 }"
          >
            <span>∨</span>
          </div>
        </div>

        <!-- 主图 -->
        <div class="main_image_container base-box">
          <div class="main_image bg-box round">
            <div class="magnify_icon cu flex-ct">
              <svg width="0.24rem" height="0.24rem" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="product_info base-box">
        <!-- 价格信息 -->
        <div class="price_info base-box">
          <div class="selling_price flex-fs">
            <span class="f14 price_label">销售价:</span>
            <span class="f24 fw-700 price_value">¥{{ productInfo.sellingPrice }}</span>
          </div>
          <div class="market_price flex-fs">
            <span class="f14 market_price_label">市场价:</span>
            <span class="f16 market_price_value">¥{{ productInfo.marketPrice }}</span>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="basic_info base-box">
          <div class="info_item flex-fs">
            <span class="f14 info_label">产品名称:</span>
            <span class="f14 info_value">{{ productInfo.name }}</span>
          </div>
          <div class="info_item flex-fs">
            <span class="f14 info_label">生产厂家:</span>
            <span class="f14 info_value">{{ productInfo.manufacturer }}</span>
          </div>
          <div class="info_item flex-fs">
            <span class="f14 info_label">交货周期:</span>
            <span class="f14 info_value">{{ productInfo.deliveryCycle }}</span>
          </div>
          <div class="info_item flex-fs">
            <span class="f14 info_label">型号:</span>
            <span class="f14 info_value">{{ productInfo.model }}</span>
          </div>
          <div class="info_item flex-fs">
            <span class="f14 info_label">PN:</span>
            <span class="f14 info_value">{{ productInfo.pn }}</span>
          </div>
        </div>

        <!-- 数量选择 -->
        <div class="quantity_selector base-box flex-fs">
          <span class="f14 quantity_label">数量:</span>
          <div class="quantity_control flex-fs base-box">
            <button class="quantity_btn cu flex-ct" @click="decreaseQuantity">-</button>
            <input 
              v-model="quantity" 
              class="quantity_input text-c"
              @change="changeQuantity"
            />
            <button class="quantity_btn cu flex-ct" @click="increaseQuantity">+</button>
          </div>
        </div>

        <!-- 分享 -->
        <div class="share_section base-box flex-fs">
          <span class="f14 share_label">分享到:</span>
          <div class="share_icons flex-fs">
            <div class="share_icon flex-ct cu f16 fw-300">
              <img :src="imgUrl.detail_wechat">微信
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action_buttons base-box flex-fs">
          <button class="buy_now_btn cu flex-ct round f16 fw-500" @click="handleBuyNow">
            立即购买
          </button>
          <button class="add_cart_btn cu flex-ct round f16 fw-500" @click="handleAddToCart">
            加入购物车
          </button>
        </div>
      </div>
    </div>

    <!-- 商品介绍 -->
    <div class="product_intro base-box">
      <div class="section_title f28 fw-700 text-l">
        商品介绍
      </div>
      
      <!-- 品牌Logo -->
      <div class="brand_logo base-box flex-ct">
        <div class="brand_logo_placeholder bg-box"></div>
      </div>

      <!-- 特性介绍 -->
      <div class="features base-box">
        <div class="feature_item base-box feature_item_first">
          <div class="feature_title f18 fw-700 text-l">
            全量程覆盖
          </div>
          <div class="feature_desc f14 text-l">
            该真空计能够连续测量从大气压到超高真空的整个压力范围，无需手动更换规管，集成了热导规和冷阴极电离规的优势。
          </div>
        </div>

        <div class="feature_item base-box">
          <div class="feature_title f18 fw-700 text-l">
            自动化程度高
          </div>
          <div class="feature_desc f14 text-l">
            具备自动量程切换、零点校准、满量程校准等功能，部分型号还支持温度补偿和线性补偿。
          </div>
        </div>

        <div class="feature_item base-box">
          <div class="feature_title f18 fw-700 text-l">
            测量精准可靠
          </div>
          <div class="feature_desc f14 text-l">
            针对不同真空量程采用专用规管，分辨率可达10^-1至10^-3 Pa，典型误差≤±10%。
          </div>
        </div>

        <div class="feature_item base-box">
          <div class="feature_title f18 fw-700 text-l">
            操作与适配性强
          </div>
          <div class="feature_desc f14 text-l">
            可配置的数字显示，支持多种单位（Pa/mbar/Torr），实时显示量程状态，触摸屏控制，具备报警功能，采用插拔式设计，便于维护，兼容多种真空接口（如CF40/KF25等）。
          </div>
        </div>

        <div class="feature_item base-box">
          <div class="feature_title f18 fw-700 text-l">
            多场景适配
          </div>
          <div class="feature_desc f14 text-l">
            工业级产品具备抗干扰、防震、防尘等特性，适用于恶劣环境；实验室级产品具备高精度、高稳定性，适用于科研；还有小型、低功耗的便携式型号，适用于现场检测。
          </div>
        </div>
      </div>
    </div>

    <!-- 参数信息 -->
    <div class="specifications base-box">
      <div class="section_title f28 fw-700 text-l">
        参数信息
      </div>
      <div class="section_subtitle f20 fw-500 text-l">
        全量程真空计TPG2810
      </div>

      <!-- 测量与性能参数 -->
      <div class="spec_section base-box spec_section_first">
        <div class="spec_header flex-fs">
          <div class="spec_icon flex-ct">
            <svg width="0.24rem" height="0.24rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="spec_title f18 fw-700 text-l">
            测量与性能参数
          </div>
        </div>
        <div class="spec_content base-box">
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">真空测量范围:</span>
            <span class="f14 spec_value">5×10⁻⁹ 至 1000 mbar</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">测量精度(N₂):</span>
            <span class="f14 spec_value">5×10⁻⁹ 至 1×10⁻⁷ mbar: ±30%; 1×10⁻⁷ 至 10 mbar: ±15%; 10 至 1000 mbar: ±30%</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">重复性:</span>
            <span class="f14 spec_value">±5%</span>
          </div>
        </div>
      </div>

      <!-- 环境适应性参数 -->
      <div class="spec_section base-box">
        <div class="spec_header flex-fs">
          <div class="spec_icon flex-ct">
            <svg width="0.24rem" height="0.24rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2z" stroke-width="2"/>
            </svg>
          </div>
          <div class="spec_title f18 fw-700 text-l">
            环境适应性参数
          </div>
        </div>
        <div class="spec_content base-box">
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">工作环境温度:</span>
            <span class="f14 spec_value">5~55℃</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">存储环境温度:</span>
            <span class="f14 spec_value">-40~65℃</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">环境相对湿度:</span>
            <span class="f14 spec_value">&lt;80%</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">烘烤温度:</span>
            <span class="f14 spec_value">≤150℃</span>
          </div>
        </div>
      </div>

      <!-- 电气与机械规格 -->
      <div class="spec_section base-box">
        <div class="spec_header flex-fs">
          <div class="spec_icon flex-ct">
            <svg width="0.24rem" height="0.24rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="spec_title f18 fw-700 text-l">
            电气与机械规格
          </div>
        </div>
        <div class="spec_content base-box">
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">供电电压:</span>
            <span class="f14 spec_value">+15-30V</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">功耗:</span>
            <span class="f14 spec_value">≤2W</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">最大耐压:</span>
            <span class="f14 spec_value">10 bar (rCF法兰); 2.5 bar (rKF法兰) (限惰性气体)</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">电气连接:</span>
            <span class="f14 spec_value">FCC68设备连接器，8极，母头（网线接口）</span>
          </div>
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">防护等级:</span>
            <span class="f14 spec_value">IP40</span>
          </div>
        </div>
      </div>

      <!-- 输出与接口特性 -->
      <div class="spec_section base-box">
        <div class="spec_header flex-fs">
          <div class="spec_icon flex-ct">
            <svg width="0.24rem" height="0.24rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="6" width="20" height="12" rx="2" stroke-width="2"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2"/>
            </svg>
          </div>
          <div class="spec_title f18 fw-700 text-l">
            输出与接口特性
          </div>
        </div>
        <div class="spec_content base-box">
          <div class="spec_item flex-fs">
            <span class="f14 spec_label">信号输出:</span>
            <span class="f14 spec_value">0-10V 模拟信号（标准）; RS485 数字信号（可选）</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail_page {
  width: 100%;
  padding: 0.4rem 2.37rem 1rem;
  background-color: #fff;
}

.breadcrumb {
  color: var(--text-p);
  span {
    &:hover {
      color: var(--theme);
    }
  }
}

.breadcrumb_separator {
  margin: 0 0.1rem;
}

.product_title {
  color: var(--text-t);
  margin-top: 0.3rem;
}

.product_section {
  margin-top: 0.4rem;
  gap: 0.4rem;
  align-items: flex-start;
}

.product_images {
  gap: 0.2rem;
}

.thumbnail_list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.thumbnail_arrow {
  width: 0.4rem;
  height: 0.3rem;
  color: var(--text-p);
  font-size: 0.16rem;
  
  &.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  &:hover:not(.disabled) {
    color: var(--theme);
  }
}

.thumbnail_container {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.thumbnail_item {
  width: 0.8rem;
  height: 0.8rem;
  border: 1px solid #E0E0E0;
  padding: 0.05rem;
  
  &.active {
    border-color: var(--theme);
  }
}

.thumbnail_placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
}

.main_image_container {
  width: 5rem;
  height: 5rem;
}

.main_image {
  width: 100%;
  height: 100%;
  background-color: var(--bg-color);
  position: relative;
  border: 1px solid #E0E0E0;
}

.magnify_icon {
  position: absolute;
  bottom: 0.1rem;
  right: 0.1rem;
  width: 0.32rem;
  height: 0.32rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  color: var(--text-d);
}

.product_info {
  flex: 1;
  padding-left: 0.2rem;
}

.price_info {
  padding-bottom: 0.2rem;
  border-bottom: 1px solid #E0E0E0;
}

.price_label {
  color: var(--text-d);
}

.price_value {
  color: #FF4444;
  margin-left: 0.1rem;
}

.market_price {
  margin-top: 0.1rem;
}

.market_price_label {
  color: var(--text-p);
}

.market_price_value {
  color: var(--text-p);
  text-decoration: line-through;
  margin-left: 0.1rem;
}

.info_item {
  margin-top: 0.15rem;
  
  &:first-child {
    margin-top: 0.2rem;
  }
}

.info_label {
  color: var(--text-d);
  width: 1rem;
}

.info_value {
  color: var(--text-t);
}

.quantity_selector {
  margin-top: 0.3rem;
}

.quantity_label {
  color: var(--text-d);
  margin-right: 0.2rem;
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

.share_section {
  margin-top: 0.3rem;
}

.share_label {
  color: var(--text-d);
  margin-right: 0.1rem;
}

.share_icon {
  width: 0.94rem;
  height: 0.4rem;
  border: 1px solid #E0E0E0;
  background-color: #fff;
  border-radius: 0.2rem;
}

.share_icon_second {
  margin-left: 0.1rem;
}


.buy_now_btn {
  flex: 1;
  height: 0.5rem;
  background-color: var(--theme);
  color: #fff;
  border: none;
  
  &:hover {
    opacity: 0.9;
  }
}

.action_buttons {
  margin-top: 0.4rem;
  gap: 0.2rem;
}

.add_cart_btn {
  flex: 1;
  height: 0.5rem;
  background-color: #E8F2FF;
  color: var(--theme);
  border: 1px solid var(--theme);
  
  &:hover {
    background-color: #D6E8FF;
  }
}

.section_title {
  color: var(--text-t);
  margin-top: 0.6rem;
}

.section_subtitle {
  color: #636C6B;
  margin-top: 0.1rem;
}

.brand_logo {
  margin-top: 0.3rem;
}

.brand_logo_placeholder {
  width: 3rem;
  height: 1rem;
  background-color: var(--bg-color);
}

.feature_item {
  margin-top: 0.3rem;
  
  &.feature_item_first {
    margin-top: 0.4rem;
  }
}

.feature_title {
  color: var(--text-t);
}

.feature_desc {
  color: var(--text-d);
  margin-top: 0.15rem;
  line-height: 1.6;
}

.spec_section {
  padding: 0.2rem 0;
  margin-top: 0.3rem;
  
  &.spec_section_first {
    margin-top: 0.4rem;
  }
}

.spec_header {
  gap: 0.1rem;
}

.spec_icon {
  width: 0.32rem;
  height: 0.32rem;
  color: var(--theme);
}

.spec_title {
  color: var(--text-t);
}

.spec_content {
  padding-left: 0.42rem;
  margin-top: 0.2rem;
}

.spec_item {
  margin-top: 0.15rem;
}

.spec_label {
  color: var(--text-d);
  width: 2rem;
}

.spec_value {
  color: var(--text-t);
}
</style>