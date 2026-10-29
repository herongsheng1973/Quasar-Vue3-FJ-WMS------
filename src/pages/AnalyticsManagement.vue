<template>
  <q-page class="q-pa-md">
    <h3 class="text-h5 q-mb-md">库房管理数据分析</h3>

    <!-- 概览卡片 -->
    <div class="row q-mb-md">
      <div class="col-12 col-md-3 col-lg-2 q-pa-sm" v-for="(item, idx) in cards" :key="idx">
        <q-card class="full-height shadow-8 rounded-borders">
          <q-card-section class="text-center column justify-center q-pa-lg">
            <h4 class="text-weight-medium" :style="{ color: '#5c6bc0', fontSize: '24px' }">
              {{ item.title }}
            </h4>
            <h2 class="text-bold q-my-sm" :style="{ color: '#1a237e', fontSize: '48px' }">
              {{ item.value }}
            </h2>
            <div class="text-caption" :style="{ color: '#757575', fontSize: '24px' }">
              {{ item.unit }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <!-- 近7天入库/出库图表 -->
    <div class="row q-mb-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div ref="chartIn" style="width:100%;height:350px"></div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div ref="chartOut" style="width:100%;height:350px"></div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 第一组：428线缆类 -->
    <div class="q-mb-md">
      <q-card>
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第一组：Link-428 库存分布</h5>
          <div ref="chartGroup1" style="width:100%;height:380px"></div>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第一组：Link-428 仓库库存明细</h5>
          <q-table :rows="group1Rows" :columns="distributionColumns" row-key="product_code" dense />
        </q-card-section>
      </q-card>
    </div>
    <!-- ========== 新增：Cable各库房Cut断点分布 柱状图+表格 ========== -->
    <div class="row q-mb-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <h5 class="text-h6 q-mb-sm">线缆CUT断点各库房分布统计</h5>
            <div ref="chartCableCut" style="width:100%;height:400px"></div>
          </q-card-section>
        </q-card>

        <q-card class="q-mt-md">
          <q-card-section>
            <h5 class="text-h6 q-mb-sm">线缆CUT断点库房明细（线缆数量+FDU总量）</h5>
            <q-table :rows="warehouseCutList" :columns="warehouseCutColumns" row-key="warehouse_code" dense />
          </q-card-section>
        </q-card>
      </div>
    </div>
    <!-- 第二组：测试设备类 -->
    <div class="q-mb-md">
      <q-card>
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第二组：测试设备类 库存分布</h5>
          <div ref="chartGroup2" style="width:100%;height:380px"></div>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第二组：测试设备类 仓库库存明细</h5>
          <q-table :rows="group2Rows" :columns="distributionColumns" row-key="product_code" dense />
        </q-card-section>
      </q-card>
    </div>

    <!-- 第三组：辅材类 -->
    <div class="q-mb-md">
      <q-card>
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第三组：关键外设 库存分布</h5>
          <div ref="chartGroup3" style="width:100%;height:380px"></div>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第三组：关键外设 仓库库存明细</h5>
          <q-table :rows="group3Rows" :columns="distributionColumns" row-key="product_code" dense />
        </q-card-section>
      </q-card>
    </div>

    <!-- 第四组：测量设备类 -->
    <div class="q-mb-md">
      <q-card>
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第四组：测量设备类 库存分布</h5>
          <div ref="chartGroup4" style="width:100%;height:380px"></div>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section>
          <h5 class="text-h6 q-mb-sm">第四组：测量设备类 仓库库存明细</h5>
          <q-table :rows="group4Rows" :columns="distributionColumns" row-key="product_code" dense />
        </q-card-section>
      </q-card>
    </div>

    <!-- 热销SKU -->
    <q-card>
      <q-card-section>
        <h5 class="text-h6 q-mb-sm">热销商品TOP10</h5>
        <q-table :rows="hotSkus" row-key="sku_code" :columns="hotColumns" />
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { getWmsDashboard } from 'src/services/dashboardServiceApi'

// 原有图表DOM
const chartIn = ref(null)
const chartOut = ref(null)
// 分组图表DOM
const chartGroup1 = ref(null)
const chartGroup2 = ref(null)
const chartGroup3 = ref(null)
const chartGroup4 = ref(null)
// 新增Cable Cut图表DOM
const chartCableCut = ref(null)

// 基础数据
const overview = ref({})
const trendIn = ref([])
const trendOut = ref([])
const hotSkus = ref([])

// 仓库列 & 原始产品数据
const warehouseColumns = ref([])
const allProductRows = ref([])

// 新增：Cable Cut库房统计数据
const warehouseCutList = ref([])

// ========== 产品分组配置 ==========
const GROUP_CONFIG = [
  {
    name: '428线缆类',
    codes: [
      "ACQ-428ST-3FDU-55M",
      "ACQ-428ST-4FDU-55M",
      "ACQ-428ST-3FDU-30M",
      "ACQ-428WPSR-3FDU-55M",
      "ACQ-428WPSR-4FDU-55M",
      "ACQ-428WPSR-3FDU-30M"
    ]
  },
  {
    name: '测试设备类',
    codes: [
      "ACQ-BLA-SHOTPRO2",
      "ACQ-TEST-LT428-CN3",
      "ACQ-TEST-SMT200",
      "ACQ-TEST-SMT40",
      "ACQ-TEST-SMT400"
    ]
  },
  {
    name: '辅材类',
    codes: [
      "ACQ-LAUX-428",
      "ACQ-LAUL-428",
      "ACQ-TFOI-428",
      "ACQ-LEAD-428"
    ]
  },
  {
    name: 'SUR设备类',
    codes: [
      "SUR-RCV-R10",
      "SUR-HBK-TSC3",
      "SUR-RDO-HPB",
      "SUR-RDO-PDL",
      "SUR-RDO-TDL",
      "SUR-RDO-TRI"
    ]
  }
]

// 分组表格数据
const group1Rows = ref([])
const group2Rows = ref([])
const group3Rows = ref([])
const group4Rows = ref([])

// 概览卡片
const cards = ref([
  { title: '总SKU', value: 0, unit: '个' },
  { title: '总库存', value: 0, unit: '件' },
  { title: '预警库存', value: 0, unit: '项' },
  { title: '仓库数', value: 0, unit: '个' },
  { title: '总入库', value: 0, unit: '元' },
  { title: '总出库', value: 0, unit: '元' },
])

// 热销表格列
const hotColumns = [
  { name: 'sku', label: 'SKU', field: 'sku_code' },
  { name: 'name', label: '商品名称', field: 'product_name' },
  { name: 'total', label: '库存总量', field: 'total' },
]

// 产品仓库动态表格列
const distributionColumns = computed(() => {
  const cols = [
    { name: 'product_code', label: '产品编码', field: 'product_code', align: 'left' },
    { name: 'product_name', label: '产品名称', field: 'product_name', align: 'left' },
  ]
  warehouseColumns.value.forEach(wh => {
    cols.push({
      name: wh,
      label: wh,
      field: wh,
      align: 'center'
    })
  })
  return cols
})

// ========== Cable Cut 明细表格列配置 ==========
const warehouseCutColumns = [
  { name: 'warehouse_code', label: '仓库编码', field: 'warehouse_code', align: 'left' },
  { name: 'warehouse_name', label: '仓库名称', field: 'warehouse_name', align: 'left' },
  { name: 'cut0_cable', label: '0Cut线缆数量', field: '0cut.cable_qty', align: 'center' },
  { name: 'cut0_fdu', label: '0Cut总FDU', field: '0cut.fdu_qty', align: 'center' },
  { name: 'cut1_cable', label: '1Cut线缆数量', field: '1cut.cable_qty', align: 'center' },
  { name: 'cut1_fdu', label: '1Cut总FDU', field: '1cut.fdu_qty', align: 'center' },
  { name: 'cut2_cable', label: '2Cut线缆数量', field: '2cut.cable_qty', align: 'center' },
  { name: 'cut2_fdu', label: '2Cut总FDU', field: '2cut.fdu_qty', align: 'center' },
  { name: 'cut3_cable', label: '3Cut线缆数量', field: '3cut.cable_qty', align: 'center' },
  { name: 'cut3_fdu', label: '3Cut总FDU', field: '3cut.fdu_qty', align: 'center' },
  { name: 'total_cable', label: '仓库线缆合计', field: 'total_cable', align: 'center' },
  { name: 'total_fdu', label: '仓库FDU合计', field: 'total_fdu', align: 'center' },
]

// 统一渲染分组柱状图
function renderGroupChart(domRef, rows) {
  if (!domRef.value || !rows.length) return
  const products = rows.map(item => item.product_code)
  const colorList = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#5C6BC0', '#FF909E']
  const series = warehouseColumns.value.map((wh, idx) => {
    return {
      name: wh,
      type: 'bar',
      stack: 'total',
      data: rows.map(item => item[wh] || 0),
      itemStyle: { color: colorList[idx % colorList.length] }
    }
  })

  const chart = echarts.init(domRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: warehouseColumns.value, top: 10 },
    xAxis: {
      type: 'category',
      data: products,
      axisLabel: { rotate: 25 }
    },
    yAxis: { type: 'value' },
    series
  })
}

// ========== 渲染Cable Cut 分组柱状图（堆叠柱状图：按仓库，4种Cut堆叠） ==========
function renderCableCutChart() {
  if (!chartCableCut.value || !warehouseCutList.value.length) return
  const warehouseNames = warehouseCutList.value.map(item => item.warehouse_name)
  const colorArr = ['#1976D2', '#388E3C', '#F57C00', '#7B1FA2']
  const cutTypes = ['0cut', '1cut', '2cut', '3cut']
  const series = cutTypes.map((cut, index) => {
    return {
      name: `${cut}`,
      type: 'bar',
      stack: 'cable',
      data: warehouseCutList.value.map(item => item[cut].cable_qty),
      itemStyle: { color: colorArr[index] }
    }
  })

  const myChart = echarts.init(chartCableCut.value)
  myChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: cutTypes,
      top: 10
    },
    xAxis: {
      type: 'category',
      data: warehouseNames
    },
    yAxis: {
      type: 'value',
      name: '线缆总数量（根）'
    },
    series
  })
}

// 加载所有数据
async function loadData() {
  const res = await getWmsDashboard()
  const data = res.data

  overview.value = data.overview
  trendIn.value = data.trend.in
  trendOut.value = data.trend.out
  hotSkus.value = data.hot_sku

  // 赋值CUT库房统计数据
  warehouseCutList.value = data.product_warehouse_distribution.warehouse_cut_distribution || []

  // 解析产品仓库分布数据
  warehouseColumns.value = data.product_warehouse_distribution.warehouse_columns
  allProductRows.value = data.product_warehouse_distribution.product_rows

  // 按编码筛选分组数据
  group1Rows.value = allProductRows.value.filter(item => GROUP_CONFIG[0].codes.includes(item.product_code))
  group2Rows.value = allProductRows.value.filter(item => GROUP_CONFIG[1].codes.includes(item.product_code))
  group3Rows.value = allProductRows.value.filter(item => GROUP_CONFIG[2].codes.includes(item.product_code))
  group4Rows.value = allProductRows.value.filter(item => GROUP_CONFIG[3].codes.includes(item.product_code))

  // 卡片赋值
  cards.value = [
    { title: '总SKU', value: data.overview.total_skus, unit: '个' },
    { title: '总库存', value: data.overview.total_inventory, unit: '件' },
    { title: '预警库存', value: data.overview.warning_stock, unit: '项' },
    { title: '仓库数', value: data.overview.total_warehouse, unit: '个' },
    { title: '总入库', value: data.overview.stock_in_amount, unit: '元' },
    { title: '总出库', value: data.overview.stock_out_amount, unit: '元' },
  ]

  // 渲染原有出入库图表
  renderMainCharts()
  // 渲染CUT断点柱状图
  renderCableCutChart()
  // 渲染四组分组图表
  renderGroupChart(chartGroup1, group1Rows.value)
  renderGroupChart(chartGroup2, group2Rows.value)
  renderGroupChart(chartGroup3, group3Rows.value)
  renderGroupChart(chartGroup4, group4Rows.value)
}

// 渲染出入库趋势图
function renderMainCharts() {
  const dates = trendIn.value.map(i => i.date)
  const inVals = trendIn.value.map(i => i.value)
  const outVals = trendOut.value.map(i => i.value)

  const c1 = echarts.init(chartIn.value)
  c1.setOption({
    title: { text: '近7天入库趋势' },
    xAxis: { data: dates },
    yAxis: {},
    series: [{ type: 'bar', data: inVals, itemStyle: { color: '#1976d2' } }]
  })

  const c2 = echarts.init(chartOut.value)
  c2.setOption({
    title: { text: '近7天出库趋势' },
    xAxis: { data: dates },
    yAxis: {},
    series: [{ type: 'bar', data: outVals, itemStyle: { color: '#388e3c' } }]
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.full-height {
  height: 100%;
}
</style>
<style>
.card-dashboard {
  background: linear-gradient(135deg, #fbfcff 0%, #f2f6ff 100%);
  border: 1px solid #e3e8f7;
}
</style>
