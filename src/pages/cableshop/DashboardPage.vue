<template>
  <div class="dashboard-container">
    <page-header title="数据统计看板" />

    <!-- 项目选择器 -->
    <div class="row q-mb-md items-center">
      <div class="col-12 col-md-4">
        <q-select v-model="currentProjectId" :options="projectList" option-label="label" option-value="id" map-options
          emit-value label="选择查看项目" outlined dense @update:model-value="initData" />
      </div>
    </div>

    <!-- 核心统计卡片 -->
    <div class="row q-gutter-md">
      <statistics-card v-for="item in totalStatistics" :key="item.title" :title="item.title" :value="item.value"
        :icon="item.icon" :color="item.color" />
    </div>

    <!-- 图表区域 -->
    <div class="row q-gutter-md q-mt-md">
      <!-- 月度丢失趋势图 -->
      <q-card class="col-12 col-md-8" elevation="2">
        <q-card-section>
          <h5 class="text-primary">设备丢失月度趋势</h5>
          <v-chart class="chart" :option="monthlyLostOption" autoresize />
        </q-card-section>
      </q-card>

      <!-- 测线丢失TOP10 -->
      <q-card class="col-12 col-md-4" elevation="2">
        <q-card-section>
          <h5 class="text-primary">测线丢失TOP10</h5>
          <v-chart class="chart" :option="lineLostTopOption" autoresize />
        </q-card-section>
      </q-card>
    </div>

    <div class="row q-gutter-md q-mt-md">
      <!-- 测试通过率趋势 -->
      <q-card class="col-12 col-md-8" elevation="2">
        <q-card-section>
          <h5 class="text-primary">CableShop测试通过率趋势</h5>
          <v-chart class="chart" :option="productionRateOption" autoresize />
        </q-card-section>
      </q-card>

      <!-- 出入库月度统计 -->
      <q-card class="col-12 col-md-4" elevation="2">
        <q-card-section>
          <h5 class="text-primary">仓库出入库月度统计</h5>
          <v-chart class="chart" :option="warehouseStatOption" autoresize />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import PageHeader from '@/components/PageHeader.vue'
import StatisticsCard from '@/components/StatisticsCard.vue'
import { lostApi, cableShopApi, warehouseApi } from '@/api'
import { projectApi } from 'src/services/projectApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

// ==========================================
// 项目相关（自动加载 + 默认最大ID）
// ==========================================
const projectList = ref([])
const currentProjectId = ref(null)

const loadProjectList = async () => {
  try {
    const res = await projectApi.list()
    projectList.value = res.data.results.map(item => ({
      label: item.project_name,
      value: item.id
    }))
    // 默认选中 ID 最大项目
    if (projectList.value.length > 0) {
      const maxItem = projectList.value.reduce((a, b) => a.value > b.value ? a : b)
      currentProjectId.value = maxItem.value
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: '项目加载失败' + e.message })
  }
}

// 核心统计数据
const totalStatistics = ref([
  { title: '累计丢失电缆', value: '0 米', icon: 'cable', color: 'primary' },
  { title: '累计丢失FDU', value: '0 个', icon: 'device_hub', color: 'negative' },
  { title: '累计丢失检波器', value: '0 个', icon: 'sensors', color: 'warning' },
  { title: 'CableShop累计测试', value: '0 次', icon: 'fact_check', color: 'positive' },
])

// 图表数据
const monthlyLostOption = ref({})
const lineLostTopOption = ref({})
const productionRateOption = ref({})
const warehouseStatOption = ref({})

// 初始化数据（全部自动带 project）
const initData = async () => {
  if (!currentProjectId.value) return

  // 1. 获取累计丢失统计
  const totalLostRes = await lostApi.getTotalLostStatistics({
    params: { project: currentProjectId.value }
  })
  if (totalLostRes.code === 200) {
    totalStatistics.value[0].value = `${totalLostRes.data.total_cable || 0} 米`
    totalStatistics.value[1].value = `${totalLostRes.data.total_fdu || 0} 个`
    totalStatistics.value[2].value = `${totalLostRes.data.total_geophone || 0} 个`
  }

  // 2. 获取月度丢失汇总
  const monthlyLostRes = await lostApi.getMonthlyLostSummary({
    params: { project: currentProjectId.value }
  })
  if (monthlyLostRes.code === 200) {
    const data = monthlyLostRes.data.reverse()
    monthlyLostOption.value = {
      xAxis: { type: 'category', data: data.map((item) => item.year_month) },
      yAxis: { type: 'value', name: '电缆长度(米)' },
      tooltip: { trigger: 'axis' },
      series: [
        { name: '丢失电缆', type: 'line', data: data.map((item) => item.cable_m), smooth: true, itemStyle: { color: '#1976d2' } },
        { name: '丢失FDU', type: 'line', data: data.map((item) => item.fdu_428), smooth: true, itemStyle: { color: '#d32f2f' } },
      ],
    }
  }



  // 3. 获取测线丢失TOP10
  const lineTopRes = await lostApi.getLineLostTop10({
    params: { project: currentProjectId.value }
  })
  if (lineTopRes.code === 200) {
    const data = lineTopRes.data
    lineLostTopOption.value = {
      tooltip: { trigger: 'item' },
      series: [{
        name: '线路丢失', type: 'pie', radius: '70%',
        data: data.map((item) => ({ name: `线路${item.line}`, value: item.total_cable })),
      }],
    }
  }

  // 4. 获取测试通过率趋势
  const productionTrendRes = await cableShopApi.getProductionTrend({
    params: { project: currentProjectId.value }
  })
  if (productionTrendRes.code === 200) {
    const data = productionTrendRes.data
    productionRateOption.value = {
      xAxis: { type: 'category', data: data.map((item) => item.production_date) },
      yAxis: { type: 'value', name: '通过率(%)', max: 100 },
      tooltip: { trigger: 'axis' },
      series: [
        { name: '泄漏测试通过率', type: 'line', data: data.map((item) => item.leakage_pass_rate), smooth: true, itemStyle: { color: '#43a047' } },
        { name: 'SMT测试通过率', type: 'line', data: data.map((item) => item.smt_pass_rate), smooth: true, itemStyle: { color: '#1976d2' } },
      ],
    }
  }

  // 5. 获取仓库出入库统计
  const warehouseStatRes = await warehouseApi.getInOutStatistics({
    params: { project: currentProjectId.value }
  })
  if (warehouseStatRes.code === 200) {
    const data = warehouseStatRes.data.monthly_stat.reverse()
    warehouseStatOption.value = {
      xAxis: { type: 'category', data: data.map((item) => item.year_month) },
      yAxis: { type: 'value', name: '出入库数量' },
      tooltip: { trigger: 'axis' },
      series: [
        { name: '出入库总数', type: 'bar', data: data.map((item) => item.total_quantity), itemStyle: { color: '#7e57c2' } },
      ],
    }
  }
}

onMounted(async () => {
  await loadProjectList()
  initData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.chart {
  height: 300px;
  width: 100%;
}
</style>
